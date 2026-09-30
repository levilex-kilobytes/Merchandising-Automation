import { PoolClient } from 'pg';
import { pool, withTransaction } from '../../config/database';
import { SupplierBill } from './ap.types';

interface Row {
  id: string; bill_number: string; supplier_id: string; supplier_name: string;
  grn_id: string | null; amount: string; paid_amount: string; status: string;
  due_date: Date; issued_at: Date; paid_at: Date | null;
  created_at: Date; updated_at: Date;
}

function toBill(r: Row): SupplierBill {
  const amount = Number(r.amount);
  const paid = Number(r.paid_amount);
  return {
    id: r.id, billNumber: r.bill_number,
    supplierId: r.supplier_id, supplierName: r.supplier_name,
    grnId: r.grn_id, amount, paidAmount: paid,
    outstanding: Number((amount - paid).toFixed(2)),
    status: r.status as SupplierBill['status'],
    dueDate: r.due_date instanceof Date ? r.due_date.toISOString().slice(0, 10) : String(r.due_date),
    issuedAt: r.issued_at, paidAt: r.paid_at,
    createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

export class APRepository {
  withTransaction = withTransaction;

  async create(tx: PoolClient, input: {
    billNumber: string; supplierId: string; supplierName: string;
    grnId: string | null; amount: number; dueDate: string;
  }): Promise<SupplierBill> {
    const { rows } = await tx.query<Row>(
      `INSERT INTO supplier_bills (bill_number, supplier_id, supplier_name, grn_id, amount, due_date, status)
       VALUES ($1,$2,$3,$4,$5,$6,'open') RETURNING *`,
      [input.billNumber, input.supplierId, input.supplierName, input.grnId, input.amount, input.dueDate],
    );
    return toBill(rows[0]);
  }

  async existsForGRN(grnId: string, tx?: PoolClient): Promise<boolean> {
    const client = tx ?? pool;
    const { rowCount } = await client.query(
      `SELECT 1 FROM supplier_bills WHERE grn_id = $1 LIMIT 1`,
      [grnId],
    );
    return (rowCount ?? 0) > 0;
  }

  async findById(id: string, tx?: PoolClient): Promise<SupplierBill | null> {
    const client = tx ?? pool;
    const { rows } = await client.query<Row>(`SELECT * FROM supplier_bills WHERE id = $1`, [id]);
    return rows[0] ? toBill(rows[0]) : null;
  }

  async list(filter: { supplierId?: string; status?: string }): Promise<SupplierBill[]> {
    const clauses: string[] = [];
    const values: unknown[] = [];
    if (filter.supplierId) { values.push(filter.supplierId); clauses.push(`supplier_id = $${values.length}`); }
    if (filter.status) { values.push(filter.status); clauses.push(`status = $${values.length}`); }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const { rows } = await pool.query<Row>(
      `SELECT * FROM supplier_bills ${where} ORDER BY due_date ASC, created_at DESC LIMIT 200`,
      values,
    );
    return rows.map(toBill);
  }

  async recordPayment(tx: PoolClient, id: string, amount: number): Promise<SupplierBill> {
    const { rows: cur } = await tx.query<Row>(`SELECT * FROM supplier_bills WHERE id = $1 FOR UPDATE`, [id]);
    if (!cur[0]) throw new Error(`Bill ${id} not found`);
    const newPaid = Number(cur[0].paid_amount) + amount;
    const total = Number(cur[0].amount);
    if (newPaid > total + 0.01) throw new Error(`Payment exceeds outstanding amount`);
    const status = Math.abs(newPaid - total) < 0.01 ? 'paid' : 'partial';
    const { rows } = await tx.query<Row>(
      `UPDATE supplier_bills
       SET paid_amount = $1::numeric,
           status = $2::text,
           paid_at = CASE WHEN $2::text = 'paid' THEN NOW() ELSE paid_at END,
           updated_at = NOW()
       WHERE id = $3::uuid
       RETURNING *`,
      [newPaid, status, id],
    );
    if (!rows[0]) throw new Error(`Failed to update bill ${id}`);
    return toBill(rows[0]);
  }

  async aging(): Promise<Array<{ bucket: string; count: number; total: number }>> {
    const { rows } = await pool.query<{ bucket: string; count: string; total: string }>(
      `SELECT
         CASE
           WHEN due_date >= CURRENT_DATE THEN 'current'
           WHEN due_date >= CURRENT_DATE - INTERVAL '30 days' THEN '1-30 days'
           WHEN due_date >= CURRENT_DATE - INTERVAL '60 days' THEN '31-60 days'
           WHEN due_date >= CURRENT_DATE - INTERVAL '90 days' THEN '61-90 days'
           ELSE '90+ days'
         END AS bucket,
         COUNT(*) AS count,
         COALESCE(SUM(amount - paid_amount), 0) AS total
       FROM supplier_bills
       WHERE status IN ('open', 'partial')
       GROUP BY bucket`,
    );
    const order = ['current', '1-30 days', '31-60 days', '61-90 days', '90+ days'];
    return order.map((b) => {
      const r = rows.find((x) => x.bucket === b);
      return { bucket: b, count: r ? Number(r.count) : 0, total: r ? Number(r.total) : 0 };
    });
  }
}
