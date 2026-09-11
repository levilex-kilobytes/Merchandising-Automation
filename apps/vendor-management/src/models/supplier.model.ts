import { Supplier, SupplierProduct, SupplierProductPriceHistory, SupplierReliability } from '../types/supplier';

export interface SupplierRow {
  id: string;
  name: string;
  legal_name: string | null;
  tax_id: string | null;
  status: string;
  email: string | null;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  country: string;
  payment_terms: string;
  default_currency: string;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export function toSupplier(row: SupplierRow): Supplier {
  return {
    id: row.id,
    name: row.name,
    legalName: row.legal_name,
    taxId: row.tax_id,
    status: row.status as Supplier['status'],
    email: row.email,
    phone: row.phone,
    addressLine1: row.address_line1,
    addressLine2: row.address_line2,
    city: row.city,
    country: row.country,
    paymentTerms: row.payment_terms as Supplier['paymentTerms'],
    defaultCurrency: row.default_currency,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

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
