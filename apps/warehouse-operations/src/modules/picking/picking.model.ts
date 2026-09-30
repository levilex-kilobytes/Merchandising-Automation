import { PickTask } from './picking.types';

export interface PickTaskRow {
  id: string;
  product_code: string;
  product_name: string;
  quantity: number;
  from_bin: string;
  to_location: string;
  status: string;
  notes: string | null;
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export function toPickTask(row: PickTaskRow): PickTask {
  return {
    id: row.id,
    productCode: row.product_code,
    productName: row.product_name,
    quantity: row.quantity,
    fromBin: row.from_bin,
    toLocation: row.to_location,
    status: row.status as PickTask['status'],
    notes: row.notes,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
