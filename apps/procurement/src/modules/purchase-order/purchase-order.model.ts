import { PurchaseOrder, POLine } from './purchase-order.types';

export interface PORow {
  id: string;
  supplier_id: string;
  supplier_name: string;
  status: string;
  currency: string;
  total_cost: string;
  expected_date: Date;
  notes: string | null;
  approved_by: string | null;
  approved_at: Date | null;
  sent_at: Date | null;
  closed_at: Date | null;
  cancelled_at: Date | null;
  cancellation_reason: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface POLineRow {
  id: string;
  po_id: string;
  product_code: string;
  product_name: string;
  ordered_qty: number;
  received_qty: number;
  unit_cost: string;
  line_total: string;
  lead_time_days: number;
  created_at: Date;
  updated_at: Date;
}

export function toPurchaseOrder(row: PORow, lines?: POLineRow[]): PurchaseOrder {
  return {
    id: row.id,
    supplierId: row.supplier_id,
    supplierName: row.supplier_name,
    status: row.status as PurchaseOrder['status'],
    currency: row.currency,
    totalCost: Number(row.total_cost),
    expectedDate: row.expected_date,
    notes: row.notes,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at,
    sentAt: row.sent_at,
    closedAt: row.closed_at,
    cancelledAt: row.cancelled_at,
    cancellationReason: row.cancellation_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lines: lines?.map(toPOLine),
  };
}

export function toPOLine(row: POLineRow): POLine {
  return {
    id: row.id,
    poId: row.po_id,
    productCode: row.product_code,
    productName: row.product_name,
    orderedQty: row.ordered_qty,
    receivedQty: row.received_qty,
    unitCost: Number(row.unit_cost),
    lineTotal: Number(row.line_total),
    leadTimeDays: row.lead_time_days,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
