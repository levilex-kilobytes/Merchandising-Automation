import { PoolClient } from 'pg';
import { pool, withTransaction } from '../../config/database';
import { StockItemRow, MovementRow, toStockItem, toMovement } from './stock.model';
import { StockItem, StockMovement, ListStockQueryDto, MovementType } from './stock.types';

export class StockRepository {
  withTransaction = withTransaction;

  async upsertStockItem(tx: PoolClient, input: { productCode: string; productName: string; locationCode: string; unitCost: number; lowStockThreshold: number }): Promise<StockItem> {
    const { rows } = await tx.query<StockItemRow>(
      `INSERT INTO stock_items (product_code, product_name, location_code, unit_cost, low_stock_threshold)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (product_code, location_code)
       DO UPDATE SET product_name = EXCLUDED.product_name, unit_cost = EXCLUDED.unit_cost, updated_at = NOW()
       RETURNING *`,
      [input.productCode, input.productName, input.locationCode, input.unitCost, input.lowStockThreshold]);
    return toStockItem(rows[0]);
  }

  async incrementOnHand(tx: PoolClient, id: string, delta: number): Promise<StockItem> {
    const { rows } = await tx.query<StockItemRow>(`UPDATE stock_items SET on_hand = on_hand + $1, updated_at = NOW() WHERE id = $2 RETURNING *`, [delta, id]);
    return toStockItem(rows[0]);
  }

  async recordMovement(tx: PoolClient, input: { productCode: string; locationCode: string; movementType: MovementType; quantity: number; referenceId?: string; referenceType?: string; notes?: string }): Promise<StockMovement> {
    const { rows } = await tx.query<MovementRow>(
      `INSERT INTO stock_movements (product_code, location_code, movement_type, quantity, reference_id, reference_type, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [input.productCode, input.locationCode, input.movementType, input.quantity, input.referenceId ?? null, input.referenceType ?? null, input.notes ?? null]);
    return toMovement(rows[0]);
  }

  async findByProductAndLocation(productCode: string, locationCode: string, tx?: PoolClient): Promise<StockItem | null> {
    const client = tx ?? pool;
    const { rows } = await client.query<StockItemRow>(`SELECT * FROM stock_items WHERE product_code = $1 AND location_code = $2`, [productCode, locationCode]);
    return rows[0] ? toStockItem(rows[0]) : null;
  }

  async list(filter: ListStockQueryDto, lowThreshold: number): Promise<StockItem[]> {
    const conditions: string[] = []; const params: unknown[] = [];
    if (filter.productCode) { params.push(filter.productCode); conditions.push(`product_code = $${params.length}`); }
    if (filter.locationCode) { params.push(filter.locationCode); conditions.push(`location_code = $${params.length}`); }
    if (filter.lowOnly) { params.push(lowThreshold); conditions.push(`(on_hand - allocated) <= $${params.length}`); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await pool.query<StockItemRow>(`SELECT * FROM stock_items ${where} ORDER BY product_code, location_code`, params);
    return rows.map(toStockItem);
  }

  async listMovements(productCode?: string, locationCode?: string): Promise<StockMovement[]> {
    const conditions: string[] = []; const params: unknown[] = [];
    if (productCode) { params.push(productCode); conditions.push(`product_code = $${params.length}`); }
    if (locationCode) { params.push(locationCode); conditions.push(`location_code = $${params.length}`); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await pool.query<MovementRow>(`SELECT * FROM stock_movements ${where} ORDER BY created_at DESC LIMIT 100`, params);
    return rows.map(toMovement);
  }

  async listLocations(): Promise<string[]> {
    const { rows } = await pool.query<{ location_code: string }>(`SELECT DISTINCT location_code FROM stock_items ORDER BY location_code`);
    return rows.map((r) => r.location_code);
  }
}
