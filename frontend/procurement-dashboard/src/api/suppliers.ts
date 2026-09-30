const VENDOR_API_URL = import.meta.env.VITE_VENDOR_API_URL ?? 'http://localhost:3001/api/v1';

export interface SupplierOption {
  id: string;
  name: string;
  legalName: string | null;
  country: string;
  paymentTerms: string;
  defaultCurrency: string;
  status: string;
}

export async function listSuppliers(): Promise<SupplierOption[]> {
  const response = await fetch(`${VENDOR_API_URL}/suppliers`);
  if (!response.ok) {
    throw new Error(`Could not load suppliers (${response.status}). Is the Vendor Management service running?`);
  }
  const data = (await response.json()) as SupplierOption[];
  return data.filter((s) => s.status === 'active');
}
