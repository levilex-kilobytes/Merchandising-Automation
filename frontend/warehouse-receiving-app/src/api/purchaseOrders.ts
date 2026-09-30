const PO_API_URL = import.meta.env.VITE_PROCUREMENT_API_URL ?? 'http://localhost:3002/api/v1';

export interface POOption {
  id: string;
  supplierName: string;
  status: string;
  currency: string;
  totalCost: number;
  expectedDate: string;
  createdAt: string;
}

export async function listReceivablePurchaseOrders(): Promise<POOption[]> {
  const res = await fetch(`${PO_API_URL}/purchase-orders`);
  if (!res.ok) {
    throw new Error(`Could not load purchase orders (${res.status}). Is the Procurement service running?`);
  }
  const data = (await res.json()) as POOption[];
  return data.filter((p) => ['approved', 'sent'].includes(p.status));
}
