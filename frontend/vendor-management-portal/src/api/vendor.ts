import { apiRequest } from './client';
import {
  Supplier,
  SupplierProduct,
  PriceHistory,
  CreateSupplierDto,
  CreateSupplierProductDto,
} from './types';

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

  updateSupplier: (id: string, patch: Partial<CreateSupplierDto>) =>
    apiRequest<Supplier>(`/suppliers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),

  deactivateSupplier: (id: string) =>
    apiRequest<void>(`/suppliers/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ reason: 'Deactivated via portal' }),
    }),

  listProducts: (supplierId: string) =>
    apiRequest<SupplierProduct[]>(`/suppliers/${supplierId}/products`),

  getProduct: (supplierId: string, productCode: string) =>
    apiRequest<SupplierProduct>(
      `/suppliers/${supplierId}/products/${encodeURIComponent(productCode)}`,
    ),

  createProduct: (supplierId: string, input: CreateSupplierProductDto) =>
    apiRequest<SupplierProduct>(`/suppliers/${supplierId}/products`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  updateProduct: (id: string, patch: Partial<CreateSupplierProductDto>) =>
    apiRequest<SupplierProduct>(`/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),

  changePrice: (id: string, newCost: number, currency?: string) =>
    apiRequest<{ product: SupplierProduct; history: PriceHistory }>(
      `/products/${id}/change-price`,
      {
        method: 'POST',
        body: JSON.stringify({ newCost, currency }),
      },
    ),

  getPriceHistory: (supplierId: string, productCode: string) =>
    apiRequest<PriceHistory[]>(
      `/product-lookup/${supplierId}/${encodeURIComponent(productCode)}/price-history`,
    ),
};
