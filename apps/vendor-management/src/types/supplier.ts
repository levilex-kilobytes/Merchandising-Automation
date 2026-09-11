export type SupplierStatus = 'active' | 'inactive' | 'blacklisted';
export type PaymentTerms = 'COD' | 'NET_15' | 'NET_30' | 'NET_60' | 'NET_90';

export interface Supplier {
  id: string;
  name: string;
  legalName?: string | null;
  taxId?: string | null;
  status: SupplierStatus;
  email?: string | null;
  phone?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  country: string;
  paymentTerms: PaymentTerms;
  defaultCurrency: string;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SupplierProduct {
  id: string;
  supplierId: string;
  productCode: string;
  productName: string;
  unitCost: number;
  currency: string;
  leadTimeDays: number;
  minOrderQty: number;
  isActive: boolean;
  validFrom: Date;
  validTo?: Date | null;
}

export interface SupplierProductPriceHistory {
  id: string;
  supplierId: string;
  productCode: string;
  oldCost: number | null;
  newCost: number;
  currency: string;
  effectiveFrom: Date;
  changedAt: Date;
}

export interface SupplierReliability {
  id: string;
  supplierId: string;
  periodStart: Date;
  periodEnd: Date;
  ordersTotal: number;
  ordersOnTime: number;
  ordersLate: number;
  ordersShort: number;
  ordersDamaged: number;
  onTimeRate: number | null;
  qualityRate: number | null;
  updatedAt: Date;
}
