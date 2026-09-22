import { OutboxRepository } from '../shared/outbox.repository';
import { EventBus } from '@mfa/event-bus';
import { Logger } from '@mfa/logger';

export interface OutboxPublisherConfig {
  outbox: OutboxRepository; bus: EventBus;
  intervalMs: number; batchSize: number; logger: Logger;
}

export class OutboxPublisher {
  private timer?: NodeJS.Timeout;
  constructor(private readonly cfg: OutboxPublisherConfig) {
    if (cfg.intervalMs <= 0) throw new Error('intervalMs must be > 0');
    if (cfg.batchSize <= 0) throw new Error('batchSize must be > 0');
  }
  start(): void {
    this.timer = setInterval(() => {
      this.flush().catch((err) => this.cfg.logger.error('Outbox flush failed', { err: String(err) }));
    }, this.cfg.intervalMs);
    this.cfg.logger.info('OutboxPublisher started', { intervalMs: this.cfg.intervalMs, batchSize: this.cfg.batchSize });
  }
  stop(): void { if (this.timer) clearInterval(this.timer); }
  async flush(): Promise<void> {
    const batch = await this.cfg.outbox.fetchUnpublished(this.cfg.batchSize);
    for (const row of batch) {
      try {
        await this.cfg.bus.publish({ eventId: row.id, eventType: row.event_type, aggregateId: row.aggregate_id, occurredAt: row.created_at.toISOString(), payload: row.payload });
        await this.cfg.outbox.markPublished(row.id);
      } catch (err) {
        this.cfg.logger.error('Publish failed', { id: row.id, err: String(err) });
        break;
      }
    }
  }
}
