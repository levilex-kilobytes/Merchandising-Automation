import { api } from './client';
import { Register, RegisterSession, OpenSessionDto, RecordCountDto, CloseSessionDto } from './types';

export const auditApi = {
  listRegisters: () => api.get<Register[]>('/registers'),

  listSessions: (filters?: { storeLocation?: string; businessDate?: string; status?: string }) => {
    const params = new URLSearchParams();
    if (filters?.storeLocation) params.set('storeLocation', filters.storeLocation);
    if (filters?.businessDate) params.set('businessDate', filters.businessDate);
    if (filters?.status) params.set('status', filters.status);
    const qs = params.toString();
    return api.get<RegisterSession[]>(`/registers/sessions${qs ? `?${qs}` : ''}`);
  },

  getSession: (id: string) => api.get<RegisterSession>(`/registers/sessions/${id}`),

  openSession: (input: OpenSessionDto) => api.post<RegisterSession>('/registers/sessions', input),

  recordCount: (sessionId: string, input: RecordCountDto) =>
    api.post<RegisterSession>(`/register-sessions/sessions/${sessionId}/count`, input),

  closeSession: (sessionId: string, input: CloseSessionDto) =>
    api.post<RegisterSession>(`/registers/sessions/${sessionId}/close`, input),

  listDiscrepancies: (filters?: { storeLocation?: string; cashierId?: string }) => {
    const params = new URLSearchParams();
    if (filters?.storeLocation) params.set('storeLocation', filters.storeLocation);
    if (filters?.cashierId) params.set('cashierId', filters.cashierId);
    const qs = params.toString();
    return api.get<RegisterSession[]>(`/discrepancies${qs ? `?${qs}` : ''}`);
  },
};
