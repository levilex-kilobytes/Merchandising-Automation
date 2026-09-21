import { SupplierReliability } from './reliability.types';

export interface ReliabilityRow {
  id: string;
  supplier_id: string;
  period_start: Date;
  period_end: Date;
  orders_total: number;
  orders_on_time: number;
  orders_late: number;
  orders_short: number;
  orders_damaged: number;
  on_time_rate: string | null;
  quality_rate: string | null;
  updated_at: Date;
}

export function toReliability(row: ReliabilityRow): SupplierReliability {
  return {
    id: row.id,
    supplierId: row.supplier_id,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    ordersTotal: row.orders_total,
    ordersOnTime: row.orders_on_time,
    ordersLate: row.orders_late,
    ordersShort: row.orders_short,
    ordersDamaged: row.orders_damaged,
    onTimeRate: row.on_time_rate === null ? null : Number(row.on_time_rate),
    qualityRate: row.quality_rate === null ? null : Number(row.quality_rate),
    updatedAt: row.updated_at,
  };
}
