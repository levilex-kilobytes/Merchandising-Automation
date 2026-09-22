import { apiRequest } from './client';
import { Supplier, SupplierProduct, PriceHistory, CreateSupplierDto } from './types';

export const vendorApi = {
  listSuppliers: (filter?: { status?: string; search?: string }) => {
    const params = new URLSearchParams();
    if (filter?.status) params.set('status', filter.status);
    if (filter?.search) params.set('search', filter.search);
    const qs = params.toString();
    return apiRequest<Supplier[]>(`/suppliers${qs ? `?${qs}` : ''}`);
  },

  getSupplier: (id: string) => apiRequest<Supplier>(`/suppliers/${id}`),

  createSupplier: (input: CreateSupplierDto) =>
    apiRequest<Supplier>('/suppliers', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  deactivateSupplier: (id: string) =>
    apiRequest<void>(`/suppliers/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ reason: 'Deactivated via portal' }),
    }),

  listProducts: (supplierId: string) =>
    apiRequest<SupplierProduct[]>(`/suppliers/${supplierId}/products`),

  getPriceHistory: (supplierId: string, productCode: string) =>
    apiRequest<PriceHistory[]>(
      `/product-lookup/${supplierId}/${productCode}/price-history`,
    ),
};
