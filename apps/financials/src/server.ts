import express from 'express';
import cors from 'cors';
import { config } from './config';
import { apiRouter } from './routes';
import { errorHandler } from './middleware/error-handler';
import { requireFeature } from './middleware/feature-flag';
import { RabbitMQEventBus } from '@mfa/event-bus';
import { Logger } from '@mfa/logger';
import { OutboxRepository } from './shared/outbox.repository';
import { OutboxPublisher } from './events/publisher';
import { registerGRNHandler } from './events/handlers/grn-completed.handler';
import { registerSaleCompletedHandler } from './events/handlers/sale-completed.handler';
import { registerReturnCompletedHandler } from './events/handlers/return-completed.handler';
import { registerRegisterClosedHandler } from './events/handlers/register-closed.handler';
import { JournalService } from './modules/journal/journal.service';
import { APService } from './modules/ap/ap.service';

async function main(): Promise<void> {
  const logger = new Logger({ serviceName: config.SERVICE_NAME, level: config.LOG_LEVEL });
  logger.info('Starting service', { env: config.NODE_ENV });

  const bus = new RabbitMQEventBus({
    url: config.RABBITMQ_URL, exchange: config.EVENT_EXCHANGE,
    serviceName: config.SERVICE_NAME, logger,
  });
  await bus.connect();

  const publisher = new OutboxPublisher({
    outbox: new OutboxRepository(), bus,
    intervalMs: config.OUTBOX_INTERVAL_MS,
    batchSize: config.OUTBOX_BATCH_SIZE, logger,
  });
  publisher.start();

  const journal = new JournalService();
  const ap = new APService();

  await registerGRNHandler(bus, logger, journal, ap);
  await registerSaleCompletedHandler(bus, logger, journal);
  await registerReturnCompletedHandler(bus, logger, journal);
  await registerRegisterClosedHandler(bus, logger, journal);

  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(config.API_PREFIX, requireFeature('FEATURE_FINANCIALS', config.FEATURE_FINANCIALS), apiRouter);
  app.use(errorHandler(logger));

  app.listen(config.PORT, config.HTTP_HOST, () => {
    logger.info('REST listening', { host: config.HTTP_HOST, port: config.PORT, prefix: config.API_PREFIX });
  });

  const shutdown = async (): Promise<void> => {
    logger.info('Shutting down');
    publisher.stop();
    await bus.close();
    process.exit(0);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err) => { console.error('Fatal startup error', err); process.exit(1); });
