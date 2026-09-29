import { api } from './client';
import { PurchaseOrder, CreatePODto } from './types';

export const poApi = {
  list: () => api.get<PurchaseOrder[]>('/purchase-orders'),
  get: (id: string) => api.get<PurchaseOrder>(`/purchase-orders/${id}`),
  create: (input: CreatePODto) => api.post<PurchaseOrder>('/purchase-orders', input),
  submit: (id: string) => api.post<PurchaseOrder>(`/purchase-orders/${id}/submit`),
  approve: (id: string, approvedBy: string, note?: string) =>
    api.post<PurchaseOrder>(`/purchase-orders/${id}/approve`, { approvedBy, note }),
  send: (id: string) => api.post<PurchaseOrder>(`/purchase-orders/${id}/send`),
  close: (id: string) => api.post<PurchaseOrder>(`/purchase-orders/${id}/close`),
  cancel: (id: string, reason: string) =>
    api.post<PurchaseOrder>(`/purchase-orders/${id}/cancel`, { reason }),
};
