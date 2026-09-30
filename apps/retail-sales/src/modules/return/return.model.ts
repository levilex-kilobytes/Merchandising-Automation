import { SaleReturn, ReturnLine } from './return.types';

export interface ReturnRow {
  id: string; return_number: string; original_sale_id: string; store_location: string;
  reason: string | null; refund_total: string; status: string;
  completed_at: Date | null; created_at: Date; updated_at: Date;
}
export interface ReturnLineRow { id: string; return_id: string; product_code: string; quantity: number; refund_amount: string }

export function toReturn(r: ReturnRow, lines?: ReturnLineRow[]): SaleReturn {
  return {
    id: r.id, returnNumber: r.return_number, originalSaleId: r.original_sale_id,
    storeLocation: r.store_location, reason: r.reason, refundTotal: Number(r.refund_total),
    status: r.status as SaleReturn['status'], completedAt: r.completed_at,
    createdAt: r.created_at, updatedAt: r.updated_at,
    lines: lines?.map(toReturnLine),
  };
}
export function toReturnLine(r: ReturnLineRow): ReturnLine {
  return { id: r.id, returnId: r.return_id, productCode: r.product_code, quantity: r.quantity, refundAmount: Number(r.refund_amount) };
}
