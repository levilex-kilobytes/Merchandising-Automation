import { api } from './client';
import {
  GoodsReceivedNote,
  CreateGoodsReceivedNoteDto,
  RecordGoodsReceivedNoteLineDto,
} from './types';

export const receivingApi = {
  listGoodsReceivedNotes: (filter?: { status?: string; purchaseOrderId?: string }) => {
    const params = new URLSearchParams();
    if (filter?.status) params.set('status', filter.status);
    if (filter?.purchaseOrderId) params.set('poId', filter.purchaseOrderId);
    const qs = params.toString();
    return api.get<GoodsReceivedNote[]>(`/grns${qs ? `?${qs}` : ''}`);
  },

  getGoodsReceivedNote: (id: string) =>
    api.get<GoodsReceivedNote>(`/grns/${id}`),

  createGoodsReceivedNote: (input: CreateGoodsReceivedNoteDto) =>
    api.post<GoodsReceivedNote>('/grns', input),

  recordGoodsReceivedNoteLine: (
    goodsReceivedNoteId: string,
    input: RecordGoodsReceivedNoteLineDto,
  ) =>
    api.post<GoodsReceivedNote>(`/grns/${goodsReceivedNoteId}/lines`, input),

  completeGoodsReceivedNote: (goodsReceivedNoteId: string) =>
    api.post<GoodsReceivedNote>(`/grns/${goodsReceivedNoteId}/complete`),
};
