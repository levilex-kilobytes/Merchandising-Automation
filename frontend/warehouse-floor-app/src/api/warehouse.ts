import { api } from './client';
import {
  Location, PutawayTask, PickTask, Transfer,
  TaskStatus, CreateTransferDto,
} from './types';

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

export const warehouseApi = {
  listLocations: (zone?: string) =>
    api.get<Location[]>(`/locations${buildQuery({ zone })}`),
  getLocation: (code: string) =>
    api.get<Location>(`/locations/${encodeURIComponent(code)}`),

  listPutawayTasks: (status?: TaskStatus) =>
    api.get<PutawayTask[]>(`/putaway-tasks${buildQuery({ status })}`),
  getPutawayTask: (id: string) =>
    api.get<PutawayTask>(`/putaway-tasks/${id}`),
  completePutawayTask: (id: string) =>
    api.post<PutawayTask>(`/putaway-tasks/${id}/complete`),

  listPickTasks: (status?: TaskStatus) =>
    api.get<PickTask[]>(`/pick-tasks${buildQuery({ status })}`),
  getPickTask: (id: string) =>
    api.get<PickTask>(`/pick-tasks/${id}`),
  createPickTask: (input: { productCode: string; productName: string; quantity: number; fromBin: string; toLocation: string }) =>
    api.post<PickTask>('/pick-tasks', input),
  completePickTask: (id: string) =>
    api.post<PickTask>(`/pick-tasks/${id}/complete`),

  listTransfers: (status?: string) =>
    api.get<Transfer[]>(`/transfers${buildQuery({ status })}`),
  getTransfer: (id: string) =>
    api.get<Transfer>(`/transfers/${id}`),
  createTransfer: (input: CreateTransferDto) =>
    api.post<Transfer>('/transfers', input),
  dispatchTransfer: (id: string) =>
    api.post<Transfer>(`/transfers/${id}/dispatch`),
  receiveTransfer: (id: string) =>
    api.post<Transfer>(`/transfers/${id}/receive`),
};

export const warehouseExtApi = {
  findBySku: async (sku: string) => {
    try {
      return await api.get<Array<{ location: Location; quantity: number }>>(
        `/locations/by-sku/${encodeURIComponent(sku)}`,
      );
    } catch (e) {
      if ((e as { status?: number }).status === 404) return [];
      throw e;
    }
  },
  listAvailableBins: async (zone?: string, minFree?: number) => {
    const locations = await api.get<Location[]>(`/locations${buildQuery({ zone })}`);
    const need = minFree ?? 0;
    return locations
      .filter((l) => l.capacity - l.used >= need)
      .sort((a, b) => (b.capacity - b.used) - (a.capacity - a.used));
  },
  listZoneSummaries: async () => {
    const locations = await api.get<Location[]>('/locations');
    const byZone = new Map<string, Location[]>();
    for (const loc of locations) {
      if (!byZone.has(loc.zone)) byZone.set(loc.zone, []);
      byZone.get(loc.zone)!.push(loc);
    }
    return Array.from(byZone.entries())
      .map(([zone, locs]) => {
        const capacity = locs.reduce((s, l) => s + l.capacity, 0);
        const used = locs.reduce((s, l) => s + l.used, 0);
        return {
          zone,
          totalBins: locs.length,
          usedBins: locs.filter((l) => l.used > 0).length,
          capacity,
          used,
          utilizationPct: capacity === 0 ? 0 : Math.round((used / capacity) * 100),
          nearFull: locs.filter((l) => l.capacity > 0 && l.used / l.capacity >= 0.9).length,
          empty: locs.filter((l) => l.used === 0).length,
        };
      })
      .sort((a, b) => a.zone.localeCompare(b.zone));
  },
};
