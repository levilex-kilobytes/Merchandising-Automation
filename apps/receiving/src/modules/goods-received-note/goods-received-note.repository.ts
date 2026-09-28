import { PoolClient } from 'pg';
import { pool, withTransaction } from '../../config/database';
import { GoodsReceivedNoteRow, GoodsReceivedNoteLineRow, toGRN, toGRNLine } from './goods-received-note.model';
import { GoodsReceivedNote, GoodsReceivedNoteLine, ListGRNQueryDto, GoodsReceivedNoteStatus } from './goods-received-note.types';

export class GoodsReceivedNoteRepository {
  withTransaction = withTransaction;

  async create(
    tx: PoolClient,
    input: { purchaseOrderId: string; supplierId: string; supplierName: string; notes?: string },
  ): Promise<GoodsReceivedNote> {
    const { rows } = await tx.query<GoodsReceivedNoteRow>(
      `INSERT INTO grns (po_id, supplier_id, supplier_name, status, notes)
       VALUES ($1, $2, $3, 'draft', $4)
       RETURNING *`,
      [input.purchaseOrderId, input.supplierId, input.supplierName, input.notes ?? null],
    );
    return toGRN(rows[0]);
  }

  async addLine(
    tx: PoolClient,
    goodsReceivedNoteId: string,
    line: {
      productCode: string;
      productName: string;
      orderedQty: number;
      unitCost: number;
    },
  ): Promise<GoodsReceivedNoteLine> {
    const { rows } = await tx.query<GoodsReceivedNoteLineRow>(
      `INSERT INTO grn_lines
        (grn_id, product_code, product_name, ordered_qty, received_qty, damaged_qty, condition, unit_cost, line_total)
       VALUES ($1,$2,$3,$4,0,0,'good',$5,0)
       RETURNING *`,
      [goodsReceivedNoteId, line.productCode, line.productName, line.orderedQty, line.unitCost],
    );
    return toGRNLine(rows[0]);
  }

  async recordGoodsReceivedNoteLine(
    tx: PoolClient,
    goodsReceivedNoteId: string,
    productCode: string,
    input: { receivedQty: number; damagedQty?: number; condition: string; notes?: string },
  ): Promise<GoodsReceivedNoteLine> {
    const { rows: currentRows } = await tx.query<GoodsReceivedNoteLineRow>(
      `SELECT * FROM grn_lines WHERE grn_id = $1 AND product_code = $2 FOR UPDATE`,
      [goodsReceivedNoteId, productCode],
    );
    if (!currentRows[0]) throw new Error(`GoodsReceivedNote line ${productCode} not found`);

    const unitCost = Number(currentRows[0].unit_cost);
    const lineTotal = Number((input.receivedQty * unitCost).toFixed(2));

    const { rows } = await tx.query<GoodsReceivedNoteLineRow>(
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
        goodsReceivedNoteId,
        productCode,
      ],
    );
    return toGRNLine(rows[0]);
  }

  async findById(id: string, tx?: PoolClient): Promise<GoodsReceivedNote | null> {
    const client = tx ?? pool;
    const { rows } = await client.query<GoodsReceivedNoteRow>(`SELECT * FROM grns WHERE id = $1`, [id]);
    if (!rows[0]) return null;
    const { rows: lines } = await client.query<GoodsReceivedNoteLineRow>(
      `SELECT * FROM grn_lines WHERE grn_id = $1 ORDER BY product_code ASC`,
      [id],
    );
    return toGRN(rows[0], lines);
  }

  async list(filter: ListGRNQueryDto): Promise<GoodsReceivedNote[]> {
    const conditions: string[] = [];
    const params: unknown[] = [];
    if (filter.status) {
      params.push(filter.status);
      conditions.push(`status = $${params.length}`);
    }
    if (filter.purchaseOrderId) {
      params.push(filter.purchaseOrderId);
      conditions.push(`po_id = $${params.length}`);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await pool.query<GoodsReceivedNoteRow>(
      `SELECT * FROM grns ${where} ORDER BY created_at DESC`,
      params,
    );
    return rows.map((r) => toGRN(r));
  }

  async updateDiscrepancies(
    tx: PoolClient,
    goodsReceivedNoteId: string,
    discrepancies: { shortages: number; overages: number; damages: number },
  ): Promise<void> {
    await tx.query(
      `UPDATE grns SET shortages = $1, overages = $2, damages = $3, updated_at = NOW() WHERE id = $4`,
      [discrepancies.shortages, discrepancies.overages, discrepancies.damages, goodsReceivedNoteId],
    );
  }

  async complete(tx: PoolClient, id: string): Promise<GoodsReceivedNote> {
    const { rows } = await tx.query<GoodsReceivedNoteRow>(
      `UPDATE grns
       SET status = 'completed', received_at = NOW(), completed_at = NOW(), updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id],
    );
    return toGRN(rows[0]);
  }
}
