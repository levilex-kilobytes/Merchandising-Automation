import { EventBus } from '@mfa/event-bus';
import { Logger } from '@mfa/logger';
import { OutboxRepository } from './outbox.repository';

export function startOutboxWorker(
  bus: EventBus,
  logger: Logger,
  intervalMs = 1000,
  batchSize = 50,
): NodeJS.Timeout {
  const repo = new OutboxRepository();
  const tick = async (): Promise<void> => {
    try {
      const rows = await repo.fetchUnpublished(batchSize);
      for (const row of rows) {
        try {
          await bus.publish({
            eventId: row.id,
            eventType: row.event_type,
            aggregateId: row.aggregate_id,
            occurredAt: row.created_at.toISOString(),
            payload: row.payload,
          } as Parameters<typeof bus.publish>[0]);
          await repo.markPublished(row.id);
        } catch (err) {
          logger.error('Outbox publish failed', { id: row.id, err: String(err) });
          break;
        }
      }
    } catch (err) {
      logger.error('Outbox tick failed', { err: String(err) });
    }
  };
  const timer = setInterval(() => { void tick(); }, intervalMs);
  logger.info('OutboxWorker started', { intervalMs, batchSize });
  return timer;
}
