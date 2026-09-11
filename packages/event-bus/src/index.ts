import amqp, { Connection, Channel } from 'amqplib';
import { DomainEvent } from '@mfa/shared-types';
import { Logger } from '@mfa/logger';

export interface EventBusConfig {
  url: string;
  exchange: string;
  serviceName: string;
  logger: Logger;
}

export interface EventBus {
  publish<T>(event: DomainEvent<T>): Promise<void>;
  subscribe<T>(
    eventType: string,
    handler: (event: DomainEvent<T>) => Promise<void>,
    queueName?: string,
  ): Promise<void>;
  close(): Promise<void>;
}

export class RabbitMQEventBus implements EventBus {
  private conn?: Connection;
  private pubChannel?: Channel;
  private subChannel?: Channel;

  constructor(private readonly cfg: EventBusConfig) {
    if (!cfg.url) throw new Error('EventBusConfig.url is required');
    if (!cfg.exchange) throw new Error('EventBusConfig.exchange is required');
    if (!cfg.serviceName) throw new Error('EventBusConfig.serviceName is required');
    if (!cfg.logger) throw new Error('EventBusConfig.logger is required');
  }

  async connect(): Promise<void> {
    this.conn = await amqp.connect(this.cfg.url);
    this.pubChannel = await this.conn.createChannel();
    this.subChannel = await this.conn.createChannel();
    await this.pubChannel.assertExchange(this.cfg.exchange, 'topic', { durable: true });
    this.cfg.logger.info('EventBus connected', { exchange: this.cfg.exchange });
  }

  async publish<T>(event: DomainEvent<T>): Promise<void> {
    if (!this.pubChannel) throw new Error('EventBus not connected');
    const buffer = Buffer.from(JSON.stringify(event));
    this.pubChannel.publish(this.cfg.exchange, event.eventType, buffer, {
      persistent: true,
      contentType: 'application/json',
      messageId: event.eventId,
    });
    this.cfg.logger.debug('Event published', { type: event.eventType, id: event.eventId });
  }

  async subscribe<T>(
    eventType: string,
    handler: (event: DomainEvent<T>) => Promise<void>,
    queueName?: string,
  ): Promise<void> {
    if (!this.subChannel) throw new Error('EventBus not connected');
    const queue = queueName || `${this.cfg.serviceName}.${eventType}`;
    await this.subChannel.assertQueue(queue, { durable: true });
    await this.subChannel.bindQueue(queue, this.cfg.exchange, eventType);

    await this.subChannel.consume(queue, async (msg) => {
      if (!msg) return;
      try {
        const event = JSON.parse(msg.content.toString()) as DomainEvent<T>;
        await handler(event);
        this.subChannel!.ack(msg);
      } catch (err) {
        this.cfg.logger.error('Event handler failed', { eventType, err: String(err) });
        this.subChannel!.nack(msg, false, false);
      }
    });

    this.cfg.logger.info('Subscribed', { eventType, queue });
  }

  async close(): Promise<void> {
    try { await this.pubChannel?.close(); } catch {}
    try { await this.subChannel?.close(); } catch {}
    try { await this.conn?.close(); } catch {}
  }
}
