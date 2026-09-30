import { pool } from '../../config/database';
import { RetailPrice } from './pricing.types';

interface Row { product_code: string; product_name: string; unit_price: string; active: boolean }

export class PricingRepository {
  async findByCode(code: string): Promise<RetailPrice | null> {
    const { rows } = await pool.query<Row>(`SELECT * FROM retail_prices WHERE product_code = $1 AND active = TRUE`, [code]);
    if (!rows[0]) return null;
    return { productCode: rows[0].product_code, productName: rows[0].product_name, unitPrice: Number(rows[0].unit_price), active: rows[0].active };
  }
  async listAll(): Promise<RetailPrice[]> {
    const { rows } = await pool.query<Row>(`SELECT * FROM retail_prices WHERE active = TRUE ORDER BY product_code`);
    return rows.map((r) => ({ productCode: r.product_code, productName: r.product_name, unitPrice: Number(r.unit_price), active: r.active }));
  }
}
