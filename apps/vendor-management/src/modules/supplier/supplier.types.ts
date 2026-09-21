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

export interface CreateSupplierDto {
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

export interface UpdateSupplierDto {
  name?: string;
  legalName?: string;
  taxId?: string;
  email?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  country?: string;
  paymentTerms?: PaymentTerms;
  defaultCurrency?: string;
  notes?: string;
  status?: SupplierStatus;
}

export interface ListSuppliersQueryDto {
  status?: SupplierStatus;
  search?: string;
}
