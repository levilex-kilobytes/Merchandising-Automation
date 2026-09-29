import { api } from './client';
import {
  Location,
  PutawayTask,
  PickTask,
  Transfer,
  TaskStatus,
  CreateTransferDto,
  BinWithQuantity,
  ZoneSummary,
} from './types';

export const warehouseApi = {
  listLocations: (zone?: string) => {
    const qs = zone ? `?zone=${encodeURIComponent(zone)}` : '';
    return api.get<Location[]>(`/locations${qs}`);
  },

  getLocation: (code: string) =>
    api.get<Location>(`/locations/${encodeURIComponent(code)}`),

  listPutawayTasks: (status?: TaskStatus) => {
    const qs = status ? `?status=${status}` : '';
    return api.get<PutawayTask[]>(`/putaway-tasks${qs}`);
  },

  getPutawayTask: (id: string) => api.get<PutawayTask>(`/putaway-tasks/${id}`),

  completePutawayTask: (id: string) =>
    api.post<PutawayTask>(`/putaway-tasks/${id}/complete`),

  listPickTasks: (status?: TaskStatus) => {
    const qs = status ? `?status=${status}` : '';
    return api.get<PickTask[]>(`/pick-tasks${qs}`);
  },

  getPickTask: (id: string) => api.get<PickTask>(`/pick-tasks/${id}`),

  completePickTask: (id: string) =>
    api.post<PickTask>(`/pick-tasks/${id}/complete`),

  listTransfers: (status?: string) => {
    const qs = status ? `?status=${status}` : '';
    return api.get<Transfer[]>(`/transfers${qs}`);
  },

  getTransfer: (id: string) => api.get<Transfer>(`/transfers/${id}`),

  createTransfer: (input: CreateTransferDto) =>
    api.post<Transfer>('/transfers', input),

  dispatchTransfer: (id: string) =>
    api.post<Transfer>(`/transfers/${id}/dispatch`),

  receiveTransfer: (id: string) =>
    api.post<Transfer>(`/transfers/${id}/receive`),
};

export const warehouseExtApi = {
  findBySku: async (sku: string): Promise<BinWithQuantity[]> => {
    try {
      return await api.get<BinWithQuantity[]>(
        `/locations/by-sku/${encodeURIComponent(sku)}`,
      );
    } catch (e) {
      const status = (e as { status?: number }).status;
      if (status === 404) return [];
      throw e;
    }
  },

  listAvailableBins: async (zone?: string, minFree?: number) => {
    const qs = zone ? `?zone=${encodeURIComponent(zone)}` : '';
    const locations = await api.get<Location[]>(`/locations${qs}`);
    const need = minFree ?? 0;
    return locations
      .filter((l) => l.capacity - l.used >= need)
      .sort((a, b) => (b.capacity - b.used) - (a.capacity - a.used));
  },

  listZoneSummaries: async (): Promise<ZoneSummary[]> => {
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
          utilizationPct:
            capacity === 0 ? 0 : Math.round((used / capacity) * 100),
          nearFull: locs.filter(
            (l) => l.capacity > 0 && l.used / l.capacity >= 0.9,
          ).length,
          empty: locs.filter((l) => l.used === 0).length,
        };
      })
      .sort((a, b) => a.zone.localeCompare(b.zone));
  },
};
