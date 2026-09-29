import express from 'express';
import cors from 'cors';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { config } from './config';
import { apiRouter } from './routes';
import { errorHandler } from './middleware/error-handler';
import { requireFeature } from './middleware/feature-flag';
import { RabbitMQEventBus } from '@mfa/event-bus';
import { Logger } from '@mfa/logger';
import { OutboxRepository } from './shared/outbox.repository';
import { OutboxPublisher } from './events/publisher';
import { registerGoodsReceivedNoteCompletedHandler } from './events/handlers/goods-received-note-completed.handler';
import { buildWarehouseGrpcHandlers } from './grpc/warehouse.grpc-handler';
import { LocationService } from './modules/location/location.service';
import { PutawayService } from './modules/putaway/putaway.service';
import { PickingService } from './modules/picking/picking.service';
import { TransferService } from './modules/transfer/transfer.service';
import { startOutboxWorker } from './shared/outbox.worker';

async function main(): Promise<void> {
  const logger = new Logger({ serviceName: config.SERVICE_NAME, level: config.LOG_LEVEL });
  logger.info('Starting service', { env: config.NODE_ENV });

  const bus = new RabbitMQEventBus({
    url: config.RABBITMQ_URL, exchange: config.EVENT_EXCHANGE,
    serviceName: config.SERVICE_NAME, logger,
  });
  await bus.connect();
startOutboxWorker(bus, logger);

  const publisher = new OutboxPublisher({
    outbox: new OutboxRepository(), bus,
    intervalMs: config.OUTBOX_INTERVAL_MS,
    batchSize: config.OUTBOX_BATCH_SIZE, logger,
  });
  publisher.start();

  const locationService = new LocationService();
  const putawayService = new PutawayService();
  const pickingService = new PickingService();
  const transferService = new TransferService();

  await registerGoodsReceivedNoteCompletedHandler(bus, logger, putawayService);

  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(config.API_PREFIX, requireFeature('FEATURE_WAREHOUSE', config.FEATURE_WAREHOUSE), apiRouter);
  app.use(errorHandler(logger));

  app.listen(config.PORT, config.HTTP_HOST, () => {
    logger.info('REST listening', { host: config.HTTP_HOST, port: config.PORT, prefix: config.API_PREFIX });
  });

  const protoPath = path.resolve(__dirname, '../../../contracts/proto/warehouse.proto');
  const packageDef = protoLoader.loadSync(protoPath, { keepCase: true, longs: String, enums: String, defaults: true, oneofs: true });
  const proto = grpc.loadPackageDefinition(packageDef) as any;
  const WarehouseService = proto.mfa.warehouse.v1.WarehouseService;

  const server = new grpc.Server();
  server.addService(WarehouseService.service, buildWarehouseGrpcHandlers(
    locationService, putawayService, pickingService, transferService,
  ) as unknown as grpc.UntypedServiceImplementation);
  server.bindAsync(`${config.GRPC_HOST}:${config.GRPC_PORT}`, grpc.ServerCredentials.createInsecure(), (err, port) => {
    if (err) { logger.error('gRPC bind failed', { err: String(err) }); process.exit(1); }
    logger.info('gRPC listening', { host: config.GRPC_HOST, port });
  });

  const shutdown = async (): Promise<void> => {
    logger.info('Shutting down');
    publisher.stop();
    server.tryShutdown(() => {});
    await bus.close();
    process.exit(0);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err) => { console.error('Fatal startup error', err); process.exit(1); });
