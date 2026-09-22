import { PoolClient } from 'pg';
import { pool } from '../config/database';

export interface OutboxRow { id: string; event_type: string; aggregate_id: string; payload: unknown; created_at: Date; }

export class OutboxRepository {
  async enqueue(tx: PoolClient, event: { eventType: string; aggregateId: string; payload: unknown }): Promise<void> {
    await tx.query(`INSERT INTO outbox (event_type, aggregate_id, payload) VALUES ($1, $2, $3)`,
      [event.eventType, event.aggregateId, JSON.stringify(event.payload)]);
  }
  async fetchUnpublished(limit: number): Promise<OutboxRow[]> {
    const { rows } = await pool.query<OutboxRow>(`SELECT id, event_type, aggregate_id, payload, created_at FROM outbox WHERE published_at IS NULL ORDER BY created_at ASC LIMIT $1`, [limit]);
    return rows;
  }
  async markPublished(id: string): Promise<void> {
    await pool.query(`UPDATE outbox SET published_at = NOW() WHERE id = $1`, [id]);
  }
}
