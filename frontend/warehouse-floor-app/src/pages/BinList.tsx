import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Grid3x3, AlertTriangle, Package } from 'lucide-react';
import { warehouseApi } from '../api/warehouse';
import { CapacityBar } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import { TableSkeleton } from '../components/Skeleton';
import { StatCard } from '../components/StatCard';

export function BinList() {
  const [zone, setZone] = useState('');

  const { data: locations, isLoading, error } = useQuery({
    queryKey: ['locations', { zone }],
    queryFn: () => warehouseApi.listLocations(zone || undefined),
  });

  const stats = useMemo(() => {
    if (!locations) return { total: 0, nearFull: 0, empty: 0 };
    return {
      total: locations.length,
      nearFull: locations.filter((l) => l.capacity > 0 && l.used / l.capacity >= 0.9).length,
      empty: locations.filter((l) => l.used === 0).length,
    };
  }, [locations]);

  const zones = ['A', 'B', 'C', 'D'];

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Warehouse Bins</h2>
          <p>Live capacity across every storage location.</p>
        </div>
      </div>

      <div className="summary">
        <StatCard icon={<Grid3x3 size={22} />} label="Total Bins" value={stats.total} tone="primary" />
        <StatCard icon={<AlertTriangle size={22} />} label="Near Full" value={stats.nearFull} tone="danger" />
        <StatCard icon={<Package size={22} />} label="Empty" value={stats.empty} tone="success" />
      </div>

      <div className="filters">
        <button className={`chip ${zone === '' ? 'active' : ''}`} onClick={() => setZone('')}>All Zones</button>
        {zones.map((z) => (
          <button key={z} className={`chip ${zone === z ? 'active' : ''}`} onClick={() => setZone(z)}>
            Zone {z}
          </button>
        ))}
      </div>

      {isLoading && <TableSkeleton rows={5} />}
      {error && <div className="error-box">Failed to load locations.</div>}

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
  );
}
