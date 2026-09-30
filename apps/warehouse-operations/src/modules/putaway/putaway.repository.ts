import { PoolClient } from 'pg';
import { pool, withTransaction } from '../../config/database';
import { PutawayTaskRow, toPutawayTask } from './putaway.model';
import { PutawayTask, TaskStatus } from './putaway.types';

export class PutawayRepository {
  withTransaction = withTransaction;

  async create(tx: PoolClient, input: {
    goodsReceivedNoteId: string;
    productCode: string;
    productName: string;
    quantity: number;
    assignedBin: string;
  }): Promise<PutawayTask> {
    const { rows } = await tx.query<PutawayTaskRow>(
      `INSERT INTO putaway_tasks (goods_received_note_id, product_code, product_name, quantity, assigned_bin)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [input.goodsReceivedNoteId, input.productCode, input.productName, input.quantity, input.assignedBin],
    );
    return toPutawayTask(rows[0]);
  }

  async findById(id: string): Promise<PutawayTask | null> {
    const { rows } = await pool.query<PutawayTaskRow>(`SELECT * FROM putaway_tasks WHERE id = $1`, [id]);
    return rows[0] ? toPutawayTask(rows[0]) : null;
  }

  async list(status?: TaskStatus): Promise<PutawayTask[]> {
    const where = status ? 'WHERE status = $1' : '';
    const params = status ? [status] : [];
    const { rows } = await pool.query<PutawayTaskRow>(
      `SELECT * FROM putaway_tasks ${where} ORDER BY created_at DESC LIMIT 100`,
      params,
    );
    return rows.map(toPutawayTask);
  }

  async complete(tx: PoolClient, id: string): Promise<PutawayTask> {
    const { rows } = await tx.query<PutawayTaskRow>(
      `UPDATE putaway_tasks SET status = 'completed', completed_at = NOW(), updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id],
    );
    return toPutawayTask(rows[0]);
  }
}
