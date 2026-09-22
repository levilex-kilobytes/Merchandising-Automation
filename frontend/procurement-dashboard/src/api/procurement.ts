import { procurementRequest, vendorRequest } from './client';
import {
  PurchaseOrder,
  CreatePODto,
  VendorSupplier,
  VendorProduct,
} from './types';

export const procurementApi = {
  listPOs: (filter?: { status?: string; supplierId?: string }) => {
    const params = new URLSearchParams();
    if (filter?.status) params.set('status', filter.status);
    if (filter?.supplierId) params.set('supplierId', filter.supplierId);
    const qs = params.toString();
    return procurementRequest<PurchaseOrder[]>(
      `/purchase-orders${qs ? `?${qs}` : ''}`,
    );
  },

  getPO: (id: string) =>
    procurementRequest<PurchaseOrder>(`/purchase-orders/${id}`),

  createPO: (input: CreatePODto) =>
    procurementRequest<PurchaseOrder>('/purchase-orders', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  submitPO: (id: string) =>
    procurementRequest<PurchaseOrder>(`/purchase-orders/${id}/submit`, {
      method: 'POST',
    }),

  approvePO: (id: string, approvedBy: string, note?: string) =>
    procurementRequest<PurchaseOrder>(`/purchase-orders/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ approvedBy, note }),
    }),

  sendPO: (id: string) =>
    procurementRequest<PurchaseOrder>(`/purchase-orders/${id}/send`, {
      method: 'POST',
    }),

  closePO: (id: string) =>
    procurementRequest<PurchaseOrder>(`/purchase-orders/${id}/close`, {
      method: 'POST',
    }),

  cancelPO: (id: string, reason: string) =>
    procurementRequest<PurchaseOrder>(`/purchase-orders/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
};

export const vendorApi = {
  listSuppliers: (filter?: { status?: string }) => {
    const params = new URLSearchParams();
    if (filter?.status) params.set('status', filter.status);
    const qs = params.toString();
    return vendorRequest<VendorSupplier[]>(`/suppliers${qs ? `?${qs}` : ''}`);
  },

  listProducts: (supplierId: string) =>
    vendorRequest<VendorProduct[]>(`/suppliers/${supplierId}/products`),
};
