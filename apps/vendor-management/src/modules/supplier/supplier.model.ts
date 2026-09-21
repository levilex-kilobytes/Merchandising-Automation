import { Supplier } from './supplier.types';

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
