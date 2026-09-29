import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Package, DollarSign, AlertTriangle } from 'lucide-react';
import { inventoryApi } from '../api/inventory';
import { LocationSummary } from '../api/types';
import { StatCard } from '../components/StatCard';

const fmt = (n: number) => `KES ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function Locations() {
  const { data: items, isLoading, error } = useQuery({
    queryKey: ['stock', { location: '', lowOnly: false }],
    queryFn: () => inventoryApi.listStock(),
  });

  const summaries = useMemo<LocationSummary[]>(() => {
    if (!items) return [];
    const map = new Map<string, LocationSummary>();
    for (const item of items) {
      const entry = map.get(item.locationCode) ?? {
        locationCode: item.locationCode,
        skuCount: 0,
        totalUnits: 0,
        totalValuation: 0,
        lowStockCount: 0,
      };
      entry.skuCount += 1;
      entry.totalUnits += item.onHand;
      entry.totalValuation += item.valuation;
      if (item.available <= item.lowStockThreshold) entry.lowStockCount += 1;
      map.set(item.locationCode, entry);
    }
    return Array.from(map.values()).sort((a, b) => b.totalValuation - a.totalValuation);
  }, [items]);

  const grand = summaries.reduce(
    (s, x) => ({
      skus: s.skus + x.skuCount,
      units: s.units + x.totalUnits,
      valuation: s.valuation + x.totalValuation,
      low: s.low + x.lowStockCount,
    }),
    { skus: 0, units: 0, valuation: 0, low: 0 },
  );

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Locations</h2>
          <p>Stock rollup across every warehouse and retail store.</p>
        </div>
      </div>

      <div className="summary">
        <StatCard icon={<MapPin size={22} />} label="Locations" value={summaries.length} tone="primary" />
        <StatCard icon={<Package size={22} />} label="Total SKUs" value={grand.skus} tone="success" />
        <StatCard icon={<DollarSign size={22} />} label="Total Valuation" value={fmt(grand.valuation)} tone="primary" />
        <StatCard icon={<AlertTriangle size={22} />} label="Low Stock Items" value={grand.low} tone={grand.low > 0 ? 'danger' : 'success'} />
      </div>

      {isLoading && <div className="skeleton skeleton-row" />}
      {error && <div className="error-box">Failed to load locations.</div>}

      {summaries.length === 0 && !isLoading && (
        <div className="empty">
          <div className="empty-icon"><MapPin size={30} /></div>
          <div className="empty-title">No locations yet</div>
          <div className="empty-hint">Locations appear here once stock exists somewhere.</div>
        </div>
      )}

      {summaries.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Location</th>
              <th className="num">SKUs</th>
              <th className="num">Units</th>
              <th className="num">Valuation</th>
              <th className="num">Low Stock</th>
              <th>Share of Total</th>
            </tr>
          </thead>
          <tbody>
            {summaries.map((s) => {
              const pct = grand.valuation === 0 ? 0 : (s.totalValuation / grand.valuation) * 100;
              return (
                <tr key={s.locationCode}>
                  <td><span className="mono" style={{ fontWeight: 700 }}>{s.locationCode}</span></td>
                  <td className="num">{s.skuCount}</td>
                  <td className="num">{s.totalUnits}</td>
                  <td className="num">{fmt(s.totalValuation)}</td>
                  <td className="num">
                    {s.lowStockCount > 0
                      ? <span style={{ color: 'var(--danger)', fontWeight: 700 }}>{s.lowStockCount}</span>
                      : '0'}
                  </td>
                  <td>
                    <div className="allocation-bar" style={{ width: 120 }}>
                      <div className="allocation-fill-available" style={{ width: `${pct}%` }} />
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{pct.toFixed(1)}%</div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </>
  );
}
