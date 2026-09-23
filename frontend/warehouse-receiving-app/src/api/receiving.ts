import { api } from './client';
import { GRN, CreateGRNDto, RecordLineDto } from './types';

export const receivingApi = {
  listGRNs: (filter?: { status?: string; poId?: string }) => {
    const params = new URLSearchParams();
    if (filter?.status) params.set('status', filter.status);
    if (filter?.poId) params.set('poId', filter.poId);
    const qs = params.toString();
    return api.get<GRN[]>(`/grns${qs ? `?${qs}` : ''}`);
  },

  getGRN: (id: string) => api.get<GRN>(`/grns/${id}`),

  createGRN: (input: CreateGRNDto) => api.post<GRN>('/grns', input),

  recordLine: (grnId: string, input: RecordLineDto) =>
    api.post<GRN>(`/grns/${grnId}/lines`, input),

  completeGRN: (grnId: string) =>
    api.post<GRN>(`/grns/${grnId}/complete`),
};
