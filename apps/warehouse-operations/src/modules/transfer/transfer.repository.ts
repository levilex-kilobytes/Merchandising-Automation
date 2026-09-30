import { PoolClient } from 'pg';
import { pool, withTransaction } from '../../config/database';
import { TransferRow, TransferLineRow, toTransfer, toTransferLine } from './transfer.model';
import { Transfer, TransferLine, TransferStatus } from './transfer.types';

export class TransferRepository {
  withTransaction = withTransaction;

  async create(tx: PoolClient, input: { fromLocation: string; toLocation: string; notes?: string }): Promise<Transfer> {
    const { rows } = await tx.query<TransferRow>(
      `INSERT INTO transfers (from_location, to_location, notes) VALUES ($1,$2,$3) RETURNING *`,
      [input.fromLocation, input.toLocation, input.notes ?? null],
    );
    return toTransfer(rows[0]);
  }

  async addLine(tx: PoolClient, transferId: string, line: {
    productCode: string; productName: string; quantity: number;
  }): Promise<TransferLine> {
    const { rows } = await tx.query<TransferLineRow>(
      `INSERT INTO transfer_lines (transfer_id, product_code, product_name, quantity)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [transferId, line.productCode, line.productName, line.quantity],
    );
    return toTransferLine(rows[0]);
  }

  async findById(id: string): Promise<Transfer | null> {
    const { rows } = await pool.query<TransferRow>(`SELECT * FROM transfers WHERE id = $1`, [id]);
    if (!rows[0]) return null;
    const { rows: lines } = await pool.query<TransferLineRow>(
      `SELECT * FROM transfer_lines WHERE transfer_id = $1 ORDER BY created_at`,
      [id],
    );
    return toTransfer(rows[0], lines);
  }

  async list(status?: TransferStatus): Promise<Transfer[]> {
    const where = status ? 'WHERE status = $1' : '';
    const params = status ? [status] : [];
    const { rows } = await pool.query<TransferRow>(
      `SELECT * FROM transfers ${where} ORDER BY created_at DESC LIMIT 100`,
      params,
    );
    return rows.map((r) => toTransfer(r));
  }

  async updateStatus(
    tx: PoolClient,
    id: string,
    status: TransferStatus,
    extra: { dispatchedAt?: Date; receivedAt?: Date } = {},
  ): Promise<Transfer> {
    const sets = ['status = $1', 'updated_at = NOW()'];
    const values: unknown[] = [status];
    if (extra.dispatchedAt) { values.push(extra.dispatchedAt); sets.push(`dispatched_at = $${values.length}`); }
    if (extra.receivedAt) { values.push(extra.receivedAt); sets.push(`received_at = $${values.length}`); }
    values.push(id);
    const { rows } = await tx.query<TransferRow>(
      `UPDATE transfers SET ${sets.join(', ')} WHERE id = $${values.length} RETURNING *`,
      values,
    );
    return toTransfer(rows[0]);
  }
}
