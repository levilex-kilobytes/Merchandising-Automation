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
import { registerGRNCompletedHandler } from './events/handlers/grn-completed.handler';
import { buildInventoryGrpcHandlers } from './grpc/inventory.grpc-handler';
import { StockService } from './modules/stock/stock.service';

async function main(): Promise<void> {
  const logger = new Logger({ serviceName: config.SERVICE_NAME, level: config.LOG_LEVEL });
  logger.info('Starting service', { env: config.NODE_ENV });

  const bus = new RabbitMQEventBus({ url: config.RABBITMQ_URL, exchange: config.EVENT_EXCHANGE, serviceName: config.SERVICE_NAME, logger });
  await bus.connect();

  const publisher = new OutboxPublisher({ outbox: new OutboxRepository(), bus, intervalMs: config.OUTBOX_INTERVAL_MS, batchSize: config.OUTBOX_BATCH_SIZE, logger });
  publisher.start();

  const stockService = new StockService();
  await registerGRNCompletedHandler(bus, logger, stockService);

  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(config.API_PREFIX, requireFeature('FEATURE_INVENTORY', config.FEATURE_INVENTORY), apiRouter);
  app.use(errorHandler(logger));

  app.listen(config.PORT, config.HTTP_HOST, () => {
    logger.info('REST listening', { host: config.HTTP_HOST, port: config.PORT, prefix: config.API_PREFIX });
  });

  const protoPath = path.resolve(__dirname, '../../../contracts/proto/inventory.proto');
  const packageDef = protoLoader.loadSync(protoPath, { keepCase: true, longs: String, enums: String, defaults: true, oneofs: true });
  const proto = grpc.loadPackageDefinition(packageDef) as any;
  const InventoryService = proto.mfa.inventory.v1.InventoryService;

  const server = new grpc.Server();
  server.addService(InventoryService.service, buildInventoryGrpcHandlers(stockService));
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
