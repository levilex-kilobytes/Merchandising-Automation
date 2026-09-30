import { PutawayTask } from './putaway.types';

export interface PutawayTaskRow {
  id: string;
  goods_received_note_id: string;
  product_code: string;
  product_name: string;
  quantity: number;
  assigned_bin: string;
  status: string;
  notes: string | null;
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export function toPutawayTask(row: PutawayTaskRow): PutawayTask {
  return {
    id: row.id,
    goodsReceivedNoteId: row.goods_received_note_id,
    productCode: row.product_code,
    productName: row.product_name,
    quantity: row.quantity,
    assignedBin: row.assigned_bin,
    status: row.status as PutawayTask['status'],
    notes: row.notes,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
