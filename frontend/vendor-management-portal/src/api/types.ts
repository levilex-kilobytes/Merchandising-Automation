export type SupplierStatus = 'active' | 'inactive' | 'blacklisted';
export type PaymentTerms = 'COD' | 'NET_15' | 'NET_30' | 'NET_60' | 'NET_90';

export interface Vendor {
  id: string;
  name: string;
  legalName: string | null;
  taxId: string | null;
  status: SupplierStatus;
  email: string | null;
  phone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  country: string;
  paymentTerms: PaymentTerms;
  defaultCurrency: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VendorProduct {
  id: string;
  supplierId: string;
  productCode: string;
  productName: string;
  unitCost: number;
  currency: string;
  leadTimeDays: number;
  minOrderQty: number;
  isActive: boolean;
  effectiveFrom: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VendorHistoryEvent {
  id: string;
  vendorId: string;
  eventType: string;
  description: string;
  metadata: Record<string, unknown> | null;
  occurredAt: string;
}

export interface CreateSupplierProductDto {
  productCode: string;
  productName: string;
  unitCost: number;
  currency: string;
  leadTimeDays: number;
  minOrderQty: number;
}

export interface ChangePriceDto {
  newCost: number;
  currency?: string;
  effectiveFrom?: string;
}

export interface CreateVendorDto {
  name: string;
  legalName?: string;
  taxId?: string;
  email?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  country: string;
  paymentTerms: PaymentTerms;
  defaultCurrency: string;
  notes?: string;
}

export interface UpdateVendorDto extends Partial<CreateVendorDto> {
  status?: SupplierStatus;
}
