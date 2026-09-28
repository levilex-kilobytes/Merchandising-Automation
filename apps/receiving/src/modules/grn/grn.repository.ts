import { PoolClient } from 'pg';
import { pool, withTransaction } from '../../config/database';
import { GRNRow, GRNLineRow, toGRN, toGRNLine } from './grn.model';
import { GRN, GRNLine, ListGRNQueryDto, GRNStatus } from './grn.types';

export class GRNRepository {
  withTransaction = withTransaction;

  async create(
    tx: PoolClient,
    input: { poId: string; supplierId: string; supplierName: string; notes?: string },
  ): Promise<GRN> {
    const { rows } = await tx.query<GRNRow>(
      `INSERT INTO grns (po_id, supplier_id, supplier_name, status, notes)
       VALUES ($1, $2, $3, 'draft', $4)
       RETURNING *`,
      [input.poId, input.supplierId, input.supplierName, input.notes ?? null],
    );
    return toGRN(rows[0]);
  }

  async addLine(
    tx: PoolClient,
    grnId: string,
    line: {
      productCode: string;
      productName: string;
      orderedQty: number;
      unitCost: number;
    },
  ): Promise<GRNLine> {
    const { rows } = await tx.query<GRNLineRow>(
      `INSERT INTO grn_lines
        (grn_id, product_code, product_name, ordered_qty, received_qty, damaged_qty, condition, unit_cost, line_total)
       VALUES ($1,$2,$3,$4,0,0,'good',$5,0)
       RETURNING *`,
      [grnId, line.productCode, line.productName, line.orderedQty, line.unitCost],
    );
    return toGRNLine(rows[0]);
  }

  async recordLine(
    tx: PoolClient,
    grnId: string,
    productCode: string,
    input: { receivedQty: number; damagedQty?: number; condition: string; notes?: string },
  ): Promise<GRNLine> {
    const { rows: currentRows } = await tx.query<GRNLineRow>(
      `SELECT * FROM grn_lines WHERE grn_id = $1 AND product_code = $2 FOR UPDATE`,
      [grnId, productCode],
    );
    if (!currentRows[0]) throw new Error(`GRN line ${productCode} not found`);

    const unitCost = Number(currentRows[0].unit_cost);
    const lineTotal = Number((input.receivedQty * unitCost).toFixed(2));

    const { rows } = await tx.query<GRNLineRow>(
      `UPDATE grn_lines
       SET received_qty = $1, damaged_qty = $2, condition = $3, line_total = $4, notes = $5, updated_at = NOW()
       WHERE grn_id = $6 AND product_code = $7
       RETURNING *`,
      [
        input.receivedQty,
        input.damagedQty ?? 0,
        input.condition,
        lineTotal,
        input.notes ?? null,
        grnId,
        productCode,
      ],
    );
    return toGRNLine(rows[0]);
  }

  async findById(id: string, tx?: PoolClient): Promise<GRN | null> {
    const client = tx ?? pool;
    const { rows } = await client.query<GRNRow>(`SELECT * FROM grns WHERE id = $1`, [id]);
    if (!rows[0]) return null;
    const { rows: lines } = await client.query<GRNLineRow>(
      `SELECT * FROM grn_lines WHERE grn_id = $1 ORDER BY product_code ASC`,
      [id],
    );
    return toGRN(rows[0], lines);
  }

  async list(filter: ListGRNQueryDto): Promise<GRN[]> {
    const conditions: string[] = [];
    const params: unknown[] = [];
    if (filter.status) {
      params.push(filter.status);
      conditions.push(`status = $${params.length}`);
    }
    if (filter.poId) {
      params.push(filter.poId);
      conditions.push(`po_id = $${params.length}`);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await pool.query<GRNRow>(
      `SELECT * FROM grns ${where} ORDER BY created_at DESC`,
      params,
    );
    return rows.map((r) => toGRN(r));
  }

  async updateDiscrepancies(
    tx: PoolClient,
    grnId: string,
    discrepancies: { shortages: number; overages: number; damages: number },
  ): Promise<void> {
    await tx.query(
      `UPDATE grns SET shortages = $1, overages = $2, damages = $3, updated_at = NOW() WHERE id = $4`,
      [discrepancies.shortages, discrepancies.overages, discrepancies.damages, grnId],
    );
  }

  async complete(tx: PoolClient, id: string): Promise<GRN> {
    const { rows } = await tx.query<GRNRow>(
      `UPDATE grns
       SET status = 'completed', received_at = NOW(), completed_at = NOW(), updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id],
    );
    return toGRN(rows[0]);
  }
}
