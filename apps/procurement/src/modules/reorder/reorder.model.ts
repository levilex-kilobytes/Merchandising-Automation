import { ReorderSuggestion } from './reorder.types';

export interface ReorderSuggestionRow {
  id: string;
  product_code: string;
  product_name: string;
  supplier_id: string;
  supplier_name: string;
  suggested_quantity: number;
  unit_cost: string;
  currency: string;
  lead_time_days: number;
  reason: string;
  status: string;
  converted_po_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export function toSuggestion(row: ReorderSuggestionRow): ReorderSuggestion {
  return {
    id: row.id,
    productCode: row.product_code,
    productName: row.product_name,
    supplierId: row.supplier_id,
    supplierName: row.supplier_name,
    suggestedQuantity: row.suggested_quantity,
    unitCost: Number(row.unit_cost),
    currency: row.currency,
    leadTimeDays: row.lead_time_days,
    reason: row.reason,
    status: row.status as ReorderSuggestion['status'],
    convertedPoId: row.converted_po_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
