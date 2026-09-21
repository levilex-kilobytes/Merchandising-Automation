import { SupplierProduct, SupplierProductPriceHistory } from './supplier-product.types';

export interface SupplierProductRow {
  id: string;
  supplier_id: string;
  product_code: string;
  product_name: string;
  unit_cost: string;
  currency: string;
  lead_time_days: number;
  min_order_qty: number;
  is_active: boolean;
  valid_from: Date;
  valid_to: Date | null;
}

export function toSupplierProduct(row: SupplierProductRow): SupplierProduct {
  return {
    id: row.id,
    supplierId: row.supplier_id,
    productCode: row.product_code,
    productName: row.product_name,
    unitCost: Number(row.unit_cost),
    currency: row.currency,
    leadTimeDays: row.lead_time_days,
    minOrderQty: row.min_order_qty,
    isActive: row.is_active,
    validFrom: row.valid_from,
    validTo: row.valid_to,
  };
}

export interface PriceHistoryRow {
  id: string;
  supplier_id: string;
  product_code: string;
  old_cost: string | null;
  new_cost: string;
  currency: string;
  effective_from: Date;
  changed_at: Date;
}

export function toPriceHistory(row: PriceHistoryRow): SupplierProductPriceHistory {
  return {
    id: row.id,
    supplierId: row.supplier_id,
    productCode: row.product_code,
    oldCost: row.old_cost === null ? null : Number(row.old_cost),
    newCost: Number(row.new_cost),
    currency: row.currency,
    effectiveFrom: row.effective_from,
    changedAt: row.changed_at,
  };
}
