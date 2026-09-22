import { PoolClient } from 'pg';
import { pool, withTransaction } from '../../config/database';
import { PORow, POLineRow, toPurchaseOrder, toPOLine } from './purchase-order.model';
import { PurchaseOrder, POLine, ListPOQueryDto, POStatus } from './purchase-order.types';

export class PurchaseOrderRepository {
  withTransaction = withTransaction;

  async createPO(
    tx: PoolClient,
    input: {
      supplierId: string;
      supplierName: string;
      currency: string;
      expectedDate: string;
      notes?: string;
    },
  ): Promise<PurchaseOrder> {
    const { rows } = await tx.query<PORow>(
      `INSERT INTO purchase_orders
        (supplier_id, supplier_name, status, currency, expected_date, notes)
       VALUES ($1, $2, 'draft', $3, $4, $5)
       RETURNING *`,
      [input.supplierId, input.supplierName, input.currency, input.expectedDate, input.notes ?? null],
    );
    return toPurchaseOrder(rows[0]);
  }

  async createLine(
    tx: PoolClient,
    poId: string,
    line: {
      productCode: string;
      productName: string;
      orderedQty: number;
      unitCost: number;
      leadTimeDays: number;
    },
  ): Promise<POLine> {
    const lineTotal = Number((line.orderedQty * line.unitCost).toFixed(2));
    const { rows } = await tx.query<POLineRow>(
      `INSERT INTO po_lines
        (po_id, product_code, product_name, ordered_qty, unit_cost, line_total, lead_time_days)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [poId, line.productCode, line.productName, line.orderedQty, line.unitCost, lineTotal, line.leadTimeDays],
    );
    return toPOLine(rows[0]);
  }

  async findById(id: string, tx?: PoolClient): Promise<PurchaseOrder | null> {
    const client = tx ?? pool;
    const { rows } = await client.query<PORow>(`SELECT * FROM purchase_orders WHERE id = $1`, [id]);
    if (!rows[0]) return null;
    const { rows: lines } = await client.query<POLineRow>(
      `SELECT * FROM po_lines WHERE po_id = $1 ORDER BY created_at ASC`,
      [id],
    );
    return toPurchaseOrder(rows[0], lines);
  }

  async list(filter: ListPOQueryDto): Promise<PurchaseOrder[]> {
    const conditions: string[] = [];
    const params: unknown[] = [];
    if (filter.status) {
      params.push(filter.status);
      conditions.push(`status = $${params.length}`);
    }
    if (filter.supplierId) {
      params.push(filter.supplierId);
      conditions.push(`supplier_id = $${params.length}`);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await pool.query<PORow>(
      `SELECT * FROM purchase_orders ${where} ORDER BY created_at DESC`,
      params,
    );
    return rows.map((r) => toPurchaseOrder(r));
  }

  async updateStatus(
    tx: PoolClient,
    id: string,
    status: POStatus,
    extra: Partial<{
      approvedBy: string;
      approvedAt: Date;
      sentAt: Date;
      closedAt: Date;
      cancelledAt: Date;
      cancellationReason: string;
      totalCost: number;
    }> = {},
  ): Promise<PurchaseOrder> {
    const sets: string[] = ['status = $1', 'updated_at = NOW()'];
    const values: unknown[] = [status];

    const map: Record<string, string> = {
      approvedBy: 'approved_by',
      approvedAt: 'approved_at',
      sentAt: 'sent_at',
      closedAt: 'closed_at',
      cancelledAt: 'cancelled_at',
      cancellationReason: 'cancellation_reason',
      totalCost: 'total_cost',
    };
    for (const [k, col] of Object.entries(map)) {
      const v = (extra as Record<string, unknown>)[k];
      if (v !== undefined) {
        values.push(v);
        sets.push(`${col} = $${values.length}`);
      }
    }
    values.push(id);
    const { rows } = await tx.query<PORow>(
      `UPDATE purchase_orders SET ${sets.join(', ')}
       WHERE id = $${values.length} RETURNING *`,
      values,
    );
    return toPurchaseOrder(rows[0]);
  }

  async recalculateTotal(tx: PoolClient, poId: string): Promise<number> {
    const { rows } = await tx.query<{ total: string }>(
      `SELECT COALESCE(SUM(line_total), 0)::text AS total FROM po_lines WHERE po_id = $1`,
      [poId],
    );
    const total = Number(rows[0].total);
    await tx.query(`UPDATE purchase_orders SET total_cost = $1, updated_at = NOW() WHERE id = $2`, [total, poId]);
    return total;
  }

  async addApproval(tx: PoolClient, poId: string, approvedBy: string, note?: string): Promise<void> {
    await tx.query(
      `INSERT INTO approvals (po_id, approved_by, note) VALUES ($1, $2, $3)`,
      [poId, approvedBy, note ?? null],
    );
  }

  async updateLineReceivedQty(tx: PoolClient, poId: string, productCode: string, receivedQty: number): Promise<void> {
    await tx.query(
      `UPDATE po_lines SET received_qty = $1, updated_at = NOW()
       WHERE po_id = $2 AND product_code = $3`,
      [receivedQty, poId, productCode],
    );
  }
}
