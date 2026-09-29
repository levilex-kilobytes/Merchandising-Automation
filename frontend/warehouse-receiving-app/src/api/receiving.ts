import { api } from './client';
import { GoodsReceivedNote, RecordLineDto } from './types';

function buildQuery(params: Record<string, string | undefined>): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    const trimmed = String(v).trim();
    if (trimmed === '') continue;
    parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(trimmed)}`);
  }
  return parts.length ? `?${parts.join('&')}` : '';
}

export const receivingApi = {
  list: (filters?: { status?: string; purchaseOrderId?: string }) =>
    api.get<GoodsReceivedNote[]>(`/grns${buildQuery({
      status: filters?.status,
      purchaseOrderId: filters?.purchaseOrderId,
    })}`),

  get: (id: string) => api.get<GoodsReceivedNote>(`/grns/${id}`),

  createFromPO: (purchaseOrderId: string, notes?: string) =>
    api.post<GoodsReceivedNote>('/grns', { purchaseOrderId, notes }),

  recordLine: (grnId: string, input: RecordLineDto) =>
    api.post<GoodsReceivedNote>(`/grns/${grnId}/lines`, input),

  complete: (grnId: string) =>
    api.post<GoodsReceivedNote>(`/grns/${grnId}/complete`),
};
