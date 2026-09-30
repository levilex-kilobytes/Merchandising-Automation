import { PoolClient } from 'pg';
import { pool, withTransaction } from '../../config/database';
import { PickTaskRow, toPickTask } from './picking.model';
import { PickTask, CreatePickTaskDto, PickTaskStatus } from './picking.types';

export class PickTaskRepository {
  withTransaction = withTransaction;

  async create(tx: PoolClient, input: CreatePickTaskDto): Promise<PickTask> {
    const { rows } = await tx.query<PickTaskRow>(
      `INSERT INTO pick_tasks (product_code, product_name, quantity, from_bin, to_location, notes)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [input.productCode, input.productName, input.quantity, input.fromBin, input.toLocation, input.notes ?? null],
    );
    return toPickTask(rows[0]);
  }

  async findById(id: string): Promise<PickTask | null> {
    const { rows } = await pool.query<PickTaskRow>(`SELECT * FROM pick_tasks WHERE id = $1`, [id]);
    return rows[0] ? toPickTask(rows[0]) : null;
  }

  async list(status?: PickTaskStatus): Promise<PickTask[]> {
    const where = status ? 'WHERE status = $1' : '';
    const params = status ? [status] : [];
    const { rows } = await pool.query<PickTaskRow>(
      `SELECT * FROM pick_tasks ${where} ORDER BY created_at DESC LIMIT 100`,
      params,
    );
    return rows.map(toPickTask);
  }

  async complete(tx: PoolClient, id: string): Promise<PickTask> {
    const { rows } = await tx.query<PickTaskRow>(
      `UPDATE pick_tasks SET status = 'completed', completed_at = NOW(), updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id],
    );
    return toPickTask(rows[0]);
  }
}
