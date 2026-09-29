import { PoolClient } from 'pg';
import { pool, withTransaction } from '../../config/database';
import { SaleRow, SaleLineRow, PaymentRow, toSale, toSaleLine, toPayment } from './sale.model';
import { Sale } from './sale.types';

export class SaleRepository {
  withTransaction = withTransaction;

  async create(tx: PoolClient, input: {
    saleNumber: string; storeLocation: string; cashierId: string | null;
    subtotal: number; discountTotal: number; taxTotal: number; grandTotal: number;
  }): Promise<Sale> {
    const { rows } = await tx.query<SaleRow>(
      `INSERT INTO sales (sale_number, store_location, cashier_id, subtotal, discount_total, tax_total, grand_total, status, completed_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'completed', NOW()) RETURNING *`,
      [input.saleNumber, input.storeLocation, input.cashierId, input.subtotal, input.discountTotal, input.taxTotal, input.grandTotal],
    );
    return toSale(rows[0]);
  }

  async addLine(tx: PoolClient, saleId: string, line: {
    productCode: string; productName: string; quantity: number;
    unitPrice: number; discountAmount: number; lineTotal: number;
  }): Promise<void> {
    await tx.query(
      `INSERT INTO sale_lines (sale_id, product_code, product_name, quantity, unit_price, discount_amount, line_total)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [saleId, line.productCode, line.productName, line.quantity, line.unitPrice, line.discountAmount, line.lineTotal],
    );
  }

  async addPayment(tx: PoolClient, saleId: string, p: { method: string; amount: number; reference: string | null }): Promise<void> {
    await tx.query(
      `INSERT INTO payments (sale_id, method, amount, reference) VALUES ($1,$2,$3,$4)`,
      [saleId, p.method, p.amount, p.reference],
    );
  }

  async findById(id: string): Promise<Sale | null> {
    const { rows } = await pool.query<SaleRow>(`SELECT * FROM sales WHERE id = $1`, [id]);
    if (!rows[0]) return null;
    const { rows: lines } = await pool.query<SaleLineRow>(`SELECT * FROM sale_lines WHERE sale_id = $1 ORDER BY created_at`, [id]);
    const { rows: payments } = await pool.query<PaymentRow>(`SELECT * FROM payments WHERE sale_id = $1 ORDER BY created_at`, [id]);
    return toSale(rows[0], lines, payments);
  }

  async list(filter: { storeLocation?: string; status?: string }): Promise<Sale[]> {
    const clauses: string[] = [];
    const values: unknown[] = [];
    if (filter.storeLocation) { values.push(filter.storeLocation); clauses.push(`store_location = $${values.length}`); }
    if (filter.status) { values.push(filter.status); clauses.push(`status = $${values.length}`); }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const { rows } = await pool.query<SaleRow>(`SELECT * FROM sales ${where} ORDER BY created_at DESC LIMIT 100`, values);
    return rows.map((r) => toSale(r));
  }

  async void(tx: PoolClient, id: string): Promise<Sale> {
    const { rows } = await tx.query<SaleRow>(
      `UPDATE sales SET status = 'voided', voided_at = NOW(), updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id],
    );
    return toSale(rows[0]);
  }
}
