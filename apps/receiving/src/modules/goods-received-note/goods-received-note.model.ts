import { GoodsReceivedNote, GoodsReceivedNoteLine } from './goods-received-note.types';

export interface GoodsReceivedNoteRow {
  id: string;
  po_id: string;
  supplier_id: string;
  supplier_name: string;
  status: string;
  received_at: Date | null;
  shortages: number;
  overages: number;
  damages: number;
  notes: string | null;
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface GoodsReceivedNoteLineRow {
  id: string;
  grn_id: string;
  product_code: string;
  product_name: string;
  ordered_qty: number;
  received_qty: number;
  damaged_qty: number;
  condition: string;
  unit_cost: string;
  line_total: string;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export function toGRN(row: GoodsReceivedNoteRow, lines?: GoodsReceivedNoteLineRow[]): GoodsReceivedNote {
  return {
    id: row.id,
    purchaseOrderId: row.po_id,
    supplierId: row.supplier_id,
    supplierName: row.supplier_name,
    status: row.status as GoodsReceivedNote['status'],
    receivedAt: row.received_at,
    shortages: row.shortages,
    overages: row.overages,
    damages: row.damages,
    notes: row.notes,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lines: lines?.map(toGRNLine),
  };
}

export function toGRNLine(row: GoodsReceivedNoteLineRow): GoodsReceivedNoteLine {
  return {
    id: row.id,
    goodsReceivedNoteId: row.grn_id,
    productCode: row.product_code,
    productName: row.product_name,
    orderedQty: row.ordered_qty,
    receivedQty: row.received_qty,
    damagedQty: row.damaged_qty,
    condition: row.condition as GoodsReceivedNoteLine['condition'],
    unitCost: Number(row.unit_cost),
    lineTotal: Number(row.line_total),
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
