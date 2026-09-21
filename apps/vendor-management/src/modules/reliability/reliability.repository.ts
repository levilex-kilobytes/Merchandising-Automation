import { PoolClient } from 'pg';
import { pool, withTransaction } from '../../config/database';
import { ReliabilityRow, toReliability } from './reliability.model';
import { SupplierReliability } from './reliability.types';

export class SupplierReliabilityRepository {
  withTransaction = withTransaction;

  async recordDelivery(
    tx: PoolClient,
    input: { supplierId: string; onTime: boolean; hadShortage: boolean; hadDamage: boolean },
  ): Promise<SupplierReliability> {
    const { supplierId, onTime, hadShortage, hadDamage } = input;

    const periodStart = new Date();
    periodStart.setDate(1);
    const periodEnd = new Date(periodStart);
    periodEnd.setMonth(periodEnd.getMonth() + 1);
    periodEnd.setDate(0);

    const { rows } = await tx.query<ReliabilityRow>(
      `INSERT INTO supplier_reliability
         (supplier_id, period_start, period_end,
          orders_total, orders_on_time, orders_late,
          orders_short, orders_damaged)
       VALUES ($1,$2,$3, 1, $4, $5, $6, $7)
       ON CONFLICT (supplier_id, period_start, period_end)
       DO UPDATE SET
         orders_total    = supplier_reliability.orders_total + 1,
         orders_on_time  = supplier_reliability.orders_on_time + $4,
         orders_late     = supplier_reliability.orders_late + $5,
         orders_short    = supplier_reliability.orders_short + $6,
         orders_damaged  = supplier_reliability.orders_damaged + $7,
         updated_at      = NOW()
       RETURNING *`,
      [supplierId, periodStart, periodEnd, onTime ? 1 : 0, onTime ? 0 : 1, hadShortage ? 1 : 0, hadDamage ? 1 : 0],
    );

    const { rows: recomputed } = await tx.query<ReliabilityRow>(
      `UPDATE supplier_reliability
       SET on_time_rate = ROUND((orders_on_time::numeric / NULLIF(orders_total,0)) * 100, 2),
           quality_rate = ROUND(((orders_total - orders_short - orders_damaged)::numeric
                                 / NULLIF(orders_total,0)) * 100, 2)
       WHERE id = $1 RETURNING *`,
      [rows[0].id],
    );
    return toReliability(recomputed[0]);
  }

  async listBySupplier(supplierId: string): Promise<SupplierReliability[]> {
    const { rows } = await pool.query<ReliabilityRow>(
      `SELECT * FROM supplier_reliability WHERE supplier_id = $1 ORDER BY period_start DESC`,
      [supplierId],
    );
    return rows.map(toReliability);
  }

  async getCurrent(supplierId: string): Promise<SupplierReliability | null> {
    const { rows } = await pool.query<ReliabilityRow>(
      `SELECT * FROM supplier_reliability WHERE supplier_id = $1 ORDER BY period_start DESC LIMIT 1`,
      [supplierId],
    );
    return rows[0] ? toReliability(rows[0]) : null;
  }
}
