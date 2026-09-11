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
import { OutboxRepository } from './repositories/outbox.repository';
import { OutboxPublisher } from './events/publisher';
import { registerGrnCompletedHandler } from './events/handlers/grn-completed.handler';
import { buildVendorGrpcHandlers } from './grpc/vendor.grpc-handler';
import { SupplierService } from './services/supplier.service';
import { SupplierProductService } from './services/supplier-product.service';
import { ReliabilityService } from './services/reliability.service';

async function main(): Promise<void> {
  const logger = new Logger({
    serviceName: config.SERVICE_NAME,
    level: config.LOG_LEVEL,
  });

  logger.info('Starting service', { env: config.NODE_ENV });

  const bus = new RabbitMQEventBus({
    url: config.RABBITMQ_URL,
    exchange: config.EVENT_EXCHANGE,
    serviceName: config.SERVICE_NAME,
    logger,
  });
  await bus.connect();

  const publisher = new OutboxPublisher({
    outbox: new OutboxRepository(),
    bus,
    intervalMs: config.OUTBOX_INTERVAL_MS,
    batchSize: config.OUTBOX_BATCH_SIZE,
    logger,
  });
  publisher.start();

  await registerGrnCompletedHandler(bus, logger, new ReliabilityService());

  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(
    config.API_PREFIX,
    requireFeature('FEATURE_VENDOR_MANAGEMENT', config.FEATURE_VENDOR_MANAGEMENT),
    apiRouter,
  );
  app.use(errorHandler(logger));

  app.listen(config.PORT, config.HTTP_HOST, () => {
    logger.info('REST listening', {
      host: config.HTTP_HOST,
      port: config.PORT,
      prefix: config.API_PREFIX,
    });
  });

  const protoPath = path.resolve(__dirname, '../../../contracts/proto/vendor.proto');
  const packageDef = protoLoader.loadSync(protoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });
  const proto = grpc.loadPackageDefinition(packageDef) as Record<string, unknown>;

  logger.info('Proto loaded', { keys: Object.keys(proto) });

  const mfa = proto['mfa'] as Record<string, unknown> | undefined;
  if (!mfa) throw new Error('Proto package "mfa" not found');

  const vendor = mfa['vendor'] as Record<string, unknown> | undefined;
  if (!vendor) throw new Error('Proto package "mfa.vendor" not found');

  const v1 = vendor['v1'] as Record<string, unknown> | undefined;
  if (!v1) throw new Error('Proto package "mfa.vendor.v1" not found');

  const VendorService = v1['VendorService'] as { service: grpc.ServiceDefinition } | undefined;
  if (!VendorService) throw new Error('VendorService not found in proto');

  const server = new grpc.Server();
  server.addService(
    VendorService.service,
    buildVendorGrpcHandlers(new SupplierService(), new SupplierProductService()) as never,
  );
  server.bindAsync(
    `${config.GRPC_HOST}:${config.GRPC_PORT}`,
    grpc.ServerCredentials.createInsecure(),
    (err, port) => {
      if (err) {
        logger.error('gRPC bind failed', { err: String(err) });
        process.exit(1);
      }
      logger.info('gRPC listening', { host: config.GRPC_HOST, port });
    },
  );

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

main().catch((err) => {
  console.error('Fatal startup error', err);
  process.exit(1);
});
