import { api } from './client';
import { Sale, SaleReturn, RetailPrice, CreateSaleDto, CreateReturnDto } from './types';

export const retailApi = {
  listSalesEnriched: async (): Promise<Sale[]> => {
    const sales = await api.get<Sale[]>('/sales');
    const enriched = await Promise.all(
      sales.map(async (s) => {
        const hasLines = (s.lines?.length ?? 0) > 0;
        const hasPayments = (s.payments?.length ?? 0) > 0;
        if (hasLines && hasPayments) return s;
        try {
          return await api.get<Sale>(`/sales/${s.id}`);
        } catch {
          return s;
        }
      }),
    );
    return enriched;
  },

  listSales: (filters?: { storeLocation?: string; status?: string }) => {
    const params = new URLSearchParams();
    if (filters?.storeLocation) params.set('storeLocation', filters.storeLocation);
    if (filters?.status) params.set('status', filters.status);
    const qs = params.toString();
    return api.get<Sale[]>(`/sales${qs ? `?${qs}` : ''}`);
  },

  getSale: (id: string) => api.get<Sale>(`/sales/${id}`),

  createSale: (input: CreateSaleDto) => api.post<Sale>('/sales', input),

  voidSale: (id: string) => api.post<Sale>(`/sales/${id}/void`),

  listReturns: () => api.get<SaleReturn[]>('/returns'),

  getReturn: (id: string) => api.get<SaleReturn>(`/returns/${id}`),

  createReturn: (input: CreateReturnDto) => api.post<SaleReturn>('/returns', input),

  listPrices: () => api.get<RetailPrice[]>('/prices'),

  getPrice: (productCode: string) => api.get<RetailPrice>(`/prices/${encodeURIComponent(productCode)}`),

  createPrice: (input: { productCode: string; productName: string; unitPrice: number }) =>
    api.post<RetailPrice>('/prices', input),
};
