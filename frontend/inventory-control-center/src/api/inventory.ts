import { api } from './client';
import { StockItem, StockMovement, AdjustmentDto } from './types';

export const inventoryApi = {
  listStock: (filter?: { productCode?: string; locationCode?: string; lowOnly?: boolean }) => {
    const params = new URLSearchParams();
    if (filter?.productCode) params.set('productCode', filter.productCode);
    if (filter?.locationCode) params.set('locationCode', filter.locationCode);
    if (filter?.lowOnly) params.set('lowOnly', 'true');
    const qs = params.toString();
    return api.get<StockItem[]>(`/stock${qs ? `?${qs}` : ''}`);
  },

  getStockItem: (productCode: string, locationCode: string) =>
    api.get<StockItem>(`/stock/${encodeURIComponent(productCode)}/${encodeURIComponent(locationCode)}`),

  adjustStock: (input: AdjustmentDto) => api.post<StockItem>('/stock/adjust', input),

  listMovements: (filter?: { productCode?: string; locationCode?: string }) => {
    const params = new URLSearchParams();
    if (filter?.productCode) params.set('productCode', filter.productCode);
    if (filter?.locationCode) params.set('locationCode', filter.locationCode);
    const qs = params.toString();
    return api.get<StockMovement[]>(`/movements${qs ? `?${qs}` : ''}`);
  },

  listLocations: () => api.get<string[]>('/locations'),
};
