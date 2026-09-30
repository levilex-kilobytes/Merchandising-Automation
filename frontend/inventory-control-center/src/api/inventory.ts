import { api } from './client';
import { StockItem, StockMovement, AdjustStockInput } from './types';

function qs(params: Record<string, string | boolean | undefined>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '' && v !== false) p.set(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : '';
}

async function tryPaths<T>(paths: string[]): Promise<T> {
  let lastError: unknown = null;
  for (const path of paths) {
    try {
      return await api.get<T>(path);
    } catch (e) {
      lastError = e;
      const status = (e as { status?: number }).status;
      if (status !== 404) throw e;
    }
  }
  throw lastError;
}

export const inventoryApi = {
  listStock: (filters?: { productCode?: string; locationCode?: string; lowStockOnly?: boolean }) =>
    api.get<StockItem[]>(`/stock${qs({
      productCode: filters?.productCode,
      locationCode: filters?.locationCode,
      lowStockOnly: filters?.lowStockOnly,
    })}`),

  getStockItem: (productCode: string, locationCode: string) =>
    api.get<StockItem>(`/stock/${encodeURIComponent(productCode)}/${encodeURIComponent(locationCode)}`),

  adjustStock: (input: AdjustStockInput) =>
    api.post<StockItem>('/stock/adjust', input),

  listMovements: (filters?: { productCode?: string; locationCode?: string }) => {
    const suffix = qs({
      productCode: filters?.productCode,
      locationCode: filters?.locationCode,
    });
    return tryPaths<StockMovement[]>([
      `/stock/movements${suffix}`,
      `/movements${suffix}`,
      `/stock/movement${suffix}`,
    ]);
  },

  listLocations: () =>
    tryPaths<string[]>([
      '/stock/locations',
      '/locations',
    ]),
};
