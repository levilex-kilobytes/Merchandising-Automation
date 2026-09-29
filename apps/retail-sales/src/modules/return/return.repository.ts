import { PoolClient } from 'pg';
import { pool, withTransaction } from '../../config/database';
import { ReturnRow, ReturnLineRow, toReturn } from './return.model';
import { SaleReturn } from './return.types';

export class ReturnRepository {
  withTransaction = withTransaction;
  async create(tx: PoolClient, input: { returnNumber: string; originalSaleId: string; storeLocation: string; reason: string | null; refundTotal: number }): Promise<SaleReturn> {
    const { rows } = await tx.query<ReturnRow>(
      `INSERT INTO returns (return_number, original_sale_id, store_location, reason, refund_total, status, completed_at)
       VALUES ($1,$2,$3,$4,$5,'completed', NOW()) RETURNING *`,
      [input.returnNumber, input.originalSaleId, input.storeLocation, input.reason, input.refundTotal],
    );
    return toReturn(rows[0]);
  }
  async addLine(tx: PoolClient, returnId: string, line: { productCode: string; quantity: number; refundAmount: number }): Promise<void> {
    await tx.query(
      `INSERT INTO return_lines (return_id, product_code, quantity, refund_amount) VALUES ($1,$2,$3,$4)`,
      [returnId, line.productCode, line.quantity, line.refundAmount],
    );
  }
  async findById(id: string): Promise<SaleReturn | null> {
    const { rows } = await pool.query<ReturnRow>(`SELECT * FROM returns WHERE id = $1`, [id]);
    if (!rows[0]) return null;
    const { rows: lines } = await pool.query<ReturnLineRow>(`SELECT * FROM return_lines WHERE return_id = $1 ORDER BY created_at`, [id]);
    return toReturn(rows[0], lines);
  }
  async list(): Promise<SaleReturn[]> {
    const { rows } = await pool.query<ReturnRow>(`SELECT * FROM returns ORDER BY created_at DESC LIMIT 100`);
    return rows.map((r) => toReturn(r));
  }
}
