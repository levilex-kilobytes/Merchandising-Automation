import { PoolClient } from 'pg';
import { pool, withTransaction } from '../../config/database';
import { ReorderSuggestionRow, toSuggestion } from './reorder.model';
import { ReorderSuggestion, ReorderStatus } from './reorder.types';

export class ReorderRepository {
  withTransaction = withTransaction;

  async create(
    tx: PoolClient,
    input: {
      productCode: string;
      productName: string;
      supplierId: string;
      supplierName: string;
      suggestedQuantity: number;
      unitCost: number;
      currency: string;
      leadTimeDays: number;
      reason: string;
    },
  ): Promise<ReorderSuggestion> {
    const { rows } = await tx.query<ReorderSuggestionRow>(
      `INSERT INTO reorder_suggestions
         (product_code, product_name, supplier_id, supplier_name,
          suggested_quantity, unit_cost, currency, lead_time_days, reason)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        input.productCode,
        input.productName,
        input.supplierId,
        input.supplierName,
        input.suggestedQuantity,
        input.unitCost,
        input.currency,
        input.leadTimeDays,
        input.reason,
      ],
    );
    return toSuggestion(rows[0]);
  }

  async findById(id: string): Promise<ReorderSuggestion | null> {
    const { rows } = await pool.query<ReorderSuggestionRow>(
      `SELECT * FROM reorder_suggestions WHERE id = $1`,
      [id],
    );
    return rows[0] ? toSuggestion(rows[0]) : null;
  }

  async findActiveByProduct(productCode: string): Promise<ReorderSuggestion | null> {
    const { rows } = await pool.query<ReorderSuggestionRow>(
      `SELECT * FROM reorder_suggestions
       WHERE product_code = $1 AND status = 'pending'
       ORDER BY created_at DESC LIMIT 1`,
      [productCode],
    );
    return rows[0] ? toSuggestion(rows[0]) : null;
  }

  async list(status?: string): Promise<ReorderSuggestion[]> {
    const where = status ? `WHERE status = $1` : '';
    const params = status ? [status] : [];
    const { rows } = await pool.query<ReorderSuggestionRow>(
      `SELECT * FROM reorder_suggestions ${where} ORDER BY created_at DESC LIMIT 100`,
      params,
    );
    return rows.map(toSuggestion);
  }

  async updateStatus(
    tx: PoolClient,
    id: string,
    status: ReorderStatus,
    convertedPoId?: string,
  ): Promise<ReorderSuggestion> {
    const { rows } = await tx.query<ReorderSuggestionRow>(
      `UPDATE reorder_suggestions
       SET status = $1, converted_po_id = $2, updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [status, convertedPoId ?? null, id],
    );
    return toSuggestion(rows[0]);
  }
}
