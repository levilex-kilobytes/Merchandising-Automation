import { PoolClient } from 'pg';
import { pool, withTransaction } from '../../config/database';
import {
  SupplierProductRow,
  PriceHistoryRow,
  toSupplierProduct,
  toPriceHistory,
} from './supplier-product.model';
import { SupplierProduct, SupplierProductPriceHistory, CreateSupplierProductDto, UpdateSupplierProductDto } from './supplier-product.types';

export class SupplierProductRepository {
  withTransaction = withTransaction;

  async create(tx: PoolClient, supplierId: string, input: CreateSupplierProductDto): Promise<SupplierProduct> {
    const { rows } = await tx.query<SupplierProductRow>(
      `INSERT INTO supplier_products
        (supplier_id, product_code, product_name, unit_cost, currency,
         lead_time_days, min_order_qty, is_active, valid_from)
       VALUES ($1,$2,$3,$4,$5,$6,$7,TRUE,COALESCE($8, CURRENT_DATE))
       RETURNING *`,
      [
        supplierId,
        input.productCode,
        input.productName,
        input.unitCost,
        input.currency,
        input.leadTimeDays,
        input.minOrderQty,
        input.validFrom ?? null,
      ],
    );
    return toSupplierProduct(rows[0]);
  }

  async findById(id: string): Promise<SupplierProduct | null> {
    const { rows } = await pool.query<SupplierProductRow>(`SELECT * FROM supplier_products WHERE id = $1`, [id]);
    return rows[0] ? toSupplierProduct(rows[0]) : null;
  }

  async findBySupplierAndCode(supplierId: string, productCode: string): Promise<SupplierProduct | null> {
    const { rows } = await pool.query<SupplierProductRow>(
      `SELECT * FROM supplier_products WHERE supplier_id = $1 AND product_code = $2`,
      [supplierId, productCode],
    );
    return rows[0] ? toSupplierProduct(rows[0]) : null;
  }

  async listBySupplier(supplierId: string): Promise<SupplierProduct[]> {
    const { rows } = await pool.query<SupplierProductRow>(
      `SELECT * FROM supplier_products WHERE supplier_id = $1 ORDER BY product_name ASC`,
      [supplierId],
    );
    return rows.map(toSupplierProduct);
  }

  async listSuppliersForProduct(productCode: string): Promise<SupplierProduct[]> {
    const { rows } = await pool.query<SupplierProductRow>(
      `SELECT sp.* FROM supplier_products sp
       JOIN suppliers s ON s.id = sp.supplier_id
       WHERE sp.product_code = $1
         AND sp.is_active = TRUE
         AND s.status = 'active'
       ORDER BY sp.unit_cost ASC`,
      [productCode],
    );
    return rows.map(toSupplierProduct);
  }

  async update(tx: PoolClient, id: string, patch: UpdateSupplierProductDto): Promise<SupplierProduct> {
    const map: Record<string, string> = {
      productName: 'product_name',
      unitCost: 'unit_cost',
      currency: 'currency',
      leadTimeDays: 'lead_time_days',
      minOrderQty: 'min_order_qty',
      isActive: 'is_active',
    };
    const sets: string[] = [];
    const values: unknown[] = [];
    for (const [k, col] of Object.entries(map)) {
      const v = (patch as Record<string, unknown>)[k];
      if (v !== undefined) {
        values.push(v);
        sets.push(`${col} = $${values.length}`);
      }
    }
    if (sets.length === 0) {
      const { rows } = await tx.query<SupplierProductRow>(`SELECT * FROM supplier_products WHERE id = $1`, [id]);
      return toSupplierProduct(rows[0]);
    }
    values.push(id);
    const { rows } = await tx.query<SupplierProductRow>(
      `UPDATE supplier_products SET ${sets.join(', ')}, updated_at = NOW()
       WHERE id = $${values.length} RETURNING *`,
      values,
    );
    return toSupplierProduct(rows[0]);
  }

  async changePrice(
    tx: PoolClient,
    id: string,
    newCost: number,
    currency: string | undefined,
    effectiveFrom: string | undefined,
  ): Promise<{ product: SupplierProduct; history: SupplierProductPriceHistory }> {
    const { rows: currentRows } = await tx.query<SupplierProductRow>(
      `SELECT * FROM supplier_products WHERE id = $1 FOR UPDATE`,
      [id],
    );
    if (!currentRows[0]) throw new Error(`SupplierProduct ${id} not found`);
    const current = currentRows[0];

    const { rows: historyRows } = await tx.query<PriceHistoryRow>(
      `INSERT INTO supplier_product_price_history
         (supplier_id, product_code, old_cost, new_cost, currency, effective_from)
       VALUES ($1,$2,$3,$4,$5,COALESCE($6, CURRENT_DATE))
       RETURNING *`,
      [current.supplier_id, current.product_code, current.unit_cost, newCost, currency ?? current.currency, effectiveFrom ?? null],
    );

    const { rows: updatedRows } = await tx.query<SupplierProductRow>(
      `UPDATE supplier_products
       SET unit_cost = $1, currency = COALESCE($2, currency), updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [newCost, currency ?? null, id],
    );

    return {
      product: toSupplierProduct(updatedRows[0]),
      history: toPriceHistory(historyRows[0]),
    };
  }

  async listPriceHistory(supplierId: string, productCode: string): Promise<SupplierProductPriceHistory[]> {
    const { rows } = await pool.query<PriceHistoryRow>(
      `SELECT * FROM supplier_product_price_history
       WHERE supplier_id = $1 AND product_code = $2
       ORDER BY changed_at DESC`,
      [supplierId, productCode],
    );
    return rows.map(toPriceHistory);
  }
}
