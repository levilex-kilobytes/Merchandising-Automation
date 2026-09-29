import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Boxes, AlertTriangle, Package, Grid3x3 } from 'lucide-react';
import { warehouseExtApi, warehouseApi } from '../api/warehouse';
import { CapacityBar } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import { TableSkeleton, Skeleton } from '../components/Skeleton';
import { StatCard } from '../components/StatCard';

type Tab = 'overview' | 'bins';

export function ZoneCapacity() {
  const [tab, setTab] = useState<Tab>('overview');
  const [zoneFilter, setZoneFilter] = useState('');

  const { data: zones, isLoading: loadingZones, error: zonesError } = useQuery({
    queryKey: ['zone-summaries'],
    queryFn: () => warehouseExtApi.listZoneSummaries(),
    enabled: tab === 'overview',
  });

  const { data: locations, isLoading: loadingBins, error: binsError } = useQuery({
    queryKey: ['locations', { zone: zoneFilter }],
    queryFn: () => warehouseApi.listLocations(zoneFilter || undefined),
    enabled: tab === 'bins',
  });

  const totals = useMemo(() => {
    if (!zones) return { bins: 0, capacity: 0, used: 0, nearFull: 0, empty: 0 };
    return {
      bins: zones.reduce((s, z) => s + z.totalBins, 0),
      capacity: zones.reduce((s, z) => s + z.capacity, 0),
      used: zones.reduce((s, z) => s + z.used, 0),
      nearFull: zones.reduce((s, z) => s + z.nearFull, 0),
      empty: zones.reduce((s, z) => s + z.empty, 0),
    };
  }, [zones]);

  const overallPct = totals.capacity === 0 ? 0
    : Math.round((totals.used / totals.capacity) * 100);

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Warehouse Space</h2>
          <p>Zone-level utilization and per-bin capacity.</p>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'overview' ? 'active' : ''}`} onClick={() => setTab('overview')}>
          <Boxes size={16} /> Zones
        </button>
        <button className={`tab ${tab === 'bins' ? 'active' : ''}`} onClick={() => setTab('bins')}>
          <Grid3x3 size={16} /> Bins
        </button>
      </div>

      {tab === 'overview' && (
        <>
          {loadingZones && (
            <div className="skeleton-rows" style={{ marginTop: 20 }}>
              <Skeleton className="skeleton-row" />
              <Skeleton className="skeleton-row" />
            </div>
          )}

          {zonesError && <div className="error-box">Failed to load zone data.</div>}

          {zones && (
            <>
              <div className="summary">
                <StatCard icon={<Boxes size={22} />} label="Bins" value={totals.bins} tone="primary" />
                <StatCard icon={<Package size={22} />} label="Overall Util" value={`${overallPct}%`} tone="success" />
                <StatCard icon={<AlertTriangle size={22} />} label="Near Full" value={totals.nearFull} tone="danger" />
                <StatCard icon={<Grid3x3 size={22} />} label="Empty" value={totals.empty} tone="primary" />
              </div>

              <div className="zone-grid">
                {zones.map((z) => {
                  const pct = z.utilizationPct;
                  const tone = pct >= 90 ? 'danger' : pct >= 70 ? 'warn' : 'ok';
                  return (
                    <div key={z.zone} className={`zone-card zone-${tone}`}>
                      <div className="zone-card-head">
                        <span className="zone-card-name">Zone {z.zone}</span>
                        <span className={`zone-card-pct zone-pct-${tone}`}>{pct}%</span>
                      </div>
                      <div className="zone-card-bins">
                        {z.usedBins} / {z.totalBins} bins in use
                      </div>
                      <div className="zone-card-bar">
                        <div className={`zone-card-fill zone-fill-${tone}`} style={{ width: `${pct}%` }} />
                      </div>
                      <div className="zone-card-stats">
                        <span><strong>{z.used.toLocaleString()}</strong> / {z.capacity.toLocaleString()} units</span>
                        {z.nearFull > 0 && (
                          <span className="zone-badge zone-badge-danger">{z.nearFull} near full</span>
                        )}
                        {z.empty > 0 && (
                          <span className="zone-badge zone-badge-ok">{z.empty} empty</span>
                        )}
                      </div>
                      {pct >= 90 && (
                        <div className="zone-card-warning">
                          <AlertTriangle size={14} /> Redirect putaways away from this zone.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      {tab === 'bins' && (
        <>
          <div className="filters">
            <button className={`chip ${zoneFilter === '' ? 'active' : ''}`} onClick={() => setZoneFilter('')}>
              All Zones
            </button>
            {['A', 'B', 'C', 'D'].map((z) => (
              <button
                key={z}
                className={`chip ${zoneFilter === z ? 'active' : ''}`}
                onClick={() => setZoneFilter(z)}
              >
                Zone {z}
              </button>
            ))}
          </div>

          {loadingBins && <TableSkeleton rows={5} />}
          {binsError && <div className="error-box">Failed to load bins.</div>}

          {locations && locations.length === 0 && (
            <EmptyState
              icon={<Grid3x3 size={30} />}
              title="No bins found"
              hint="No storage locations match the selected zone."
            />
          )}

          {locations && locations.length > 0 && (
            <table className="responsive-table">
              <thead>
                <tr>
                  <th>Bin Code</th>
                  <th>Zone</th>
                  <th>Aisle</th>
                  <th>Rack</th>
                  <th>Shelf</th>
                  <th>Capacity</th>
                </tr>
              </thead>
              <tbody>
                {locations.map((loc) => (
                  <tr key={loc.id}>
                    <td data-label="Bin"><code style={{ fontSize: 15, fontWeight: 700 }}>{loc.code}</code></td>
                    <td data-label="Zone">{loc.zone}</td>
                    <td data-label="Aisle">{loc.aisle}</td>
                    <td data-label="Rack">{loc.rack}</td>
                    <td data-label="Shelf">{loc.shelf}</td>
                    <td data-label="Capacity" style={{ minWidth: 180 }}>
                      <CapacityBar used={loc.used} capacity={loc.capacity} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </>
  );
}
