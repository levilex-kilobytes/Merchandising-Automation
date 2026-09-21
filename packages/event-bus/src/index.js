"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RabbitMQEventBus = void 0;
const amqplib_1 = __importDefault(require("amqplib"));
class RabbitMQEventBus {
    cfg;
    conn;
    pubChannel;
    subChannel;
    constructor(cfg) {
        this.cfg = cfg;
        if (!cfg.url)
            throw new Error('EventBusConfig.url is required');
        if (!cfg.exchange)
            throw new Error('EventBusConfig.exchange is required');
        if (!cfg.serviceName)
            throw new Error('EventBusConfig.serviceName is required');
        if (!cfg.logger)
            throw new Error('EventBusConfig.logger is required');
    }
    async connect() {
        this.conn = await amqplib_1.default.connect(this.cfg.url);
        this.pubChannel = await this.conn.createChannel();
        this.subChannel = await this.conn.createChannel();
        await this.pubChannel.assertExchange(this.cfg.exchange, 'topic', { durable: true });
        this.cfg.logger.info('EventBus connected', { exchange: this.cfg.exchange });
    }
    async publish(event) {
        if (!this.pubChannel)
            throw new Error('EventBus not connected');
        const buffer = Buffer.from(JSON.stringify(event));
        this.pubChannel.publish(this.cfg.exchange, event.eventType, buffer, {
            persistent: true,
            contentType: 'application/json',
            messageId: event.eventId,
        });
        this.cfg.logger.debug('Event published', { type: event.eventType, id: event.eventId });
    }
    async subscribe(eventType, handler, queueName) {
        if (!this.subChannel)
            throw new Error('EventBus not connected');
        const queue = queueName || `${this.cfg.serviceName}.${eventType}`;
        await this.subChannel.assertQueue(queue, { durable: true });
        await this.subChannel.bindQueue(queue, this.cfg.exchange, eventType);
        await this.subChannel.consume(queue, async (msg) => {
            if (!msg)
                return;
            try {
                const event = JSON.parse(msg.content.toString());
                await handler(event);
                this.subChannel.ack(msg);
            }
            catch (err) {
                this.cfg.logger.error('Event handler failed', { eventType, err: String(err) });
                this.subChannel.nack(msg, false, false);
            }
        });
        this.cfg.logger.info('Subscribed', { eventType, queue });
    }
    async close() {
        try {
            await this.pubChannel?.close();
        }
        catch { }
        try {
            await this.subChannel?.close();
        }
        catch { }
        try {
            await this.conn?.close();
        }
        catch { }
    }
}
exports.RabbitMQEventBus = RabbitMQEventBus;
//# sourceMappingURL=index.js.map