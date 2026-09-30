import { api } from './client';
import {
  Vendor, VendorProduct, VendorHistoryEvent,
  CreateVendorDto, UpdateVendorDto, CreateSupplierProductDto, ChangePriceDto,
} from './types';

export const vendorsApi = {
  list: (filters?: { status?: string; search?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.search) params.set('search', filters.search);
    const qs = params.toString();
    return api.get<Vendor[]>(`/suppliers${qs ? `?${qs}` : ''}`);
  },
  get: (id: string) => api.get<Vendor>(`/suppliers/${id}`),
  create: (input: CreateVendorDto) => api.post<Vendor>('/suppliers', input),
  update: (id: string, patch: UpdateVendorDto) => api.patch<Vendor>(`/suppliers/${id}`, patch),
  deactivate: (id: string) => api.patch<Vendor>(`/suppliers/${id}`, { status: 'inactive' }),
  getHistory: async (id: string): Promise<VendorHistoryEvent[]> => {
    try {
      return await api.get<VendorHistoryEvent[]>(`/suppliers/${id}/history`);
    } catch (e) {
      const status = (e as { status?: number }).status;
      if (status === 404) return [];
      throw e;
    }
  },

  listProducts: (supplierId: string) =>
    api.get<VendorProduct[]>(`/suppliers/${supplierId}/products`),

  getProduct: (supplierId: string, productCode: string) =>
    api.get<VendorProduct>(`/suppliers/${supplierId}/products/${encodeURIComponent(productCode)}`),

  addProduct: (supplierId: string, input: CreateSupplierProductDto) =>
    api.post<VendorProduct>(`/suppliers/${supplierId}/products`, input),

  changePrice: (productId: string, input: ChangePriceDto) =>
    api.post<VendorProduct>(`/products/${productId}/change-price`, input),

  listSuppliersForProduct: (productCode: string) =>
    api.get<Array<{ supplierId: string; supplierName: string; unitCost: number; currency: string }>>(
      `/product-lookup/${encodeURIComponent(productCode)}/suppliers`,
    ),

  priceHistory: (supplierId: string, productCode: string) =>
    api.get<Array<{ unitCost: number; currency: string; changedAt: string }>>(
      `/product-lookup/${supplierId}/${encodeURIComponent(productCode)}/price-history`,
    ),
};
