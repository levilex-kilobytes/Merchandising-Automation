export type UUID = string;
export interface DomainEvent<T = unknown> {
    eventId: UUID;
    eventType: string;
    aggregateId: UUID;
    occurredAt: string;
    payload: T;
}
