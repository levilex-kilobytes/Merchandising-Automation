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
    subscribe<T>(eventType: string, handler: (event: DomainEvent<T>) => Promise<void>, queueName?: string): Promise<void>;
    close(): Promise<void>;
}
export declare class RabbitMQEventBus implements EventBus {
    private readonly cfg;
    private conn?;
    private pubChannel?;
    private subChannel?;
    constructor(cfg: EventBusConfig);
    connect(): Promise<void>;
    publish<T>(event: DomainEvent<T>): Promise<void>;
    subscribe<T>(eventType: string, handler: (event: DomainEvent<T>) => Promise<void>, queueName?: string): Promise<void>;
    close(): Promise<void>;
}
