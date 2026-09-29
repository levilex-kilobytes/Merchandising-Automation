import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import { inventoryApi } from '../api/inventory';
import { StatCard } from '../components/StatCard';

export function LowStock() {
  const { data: items, isLoading, error } = useQuery({
    queryKey: ['stock', { location: '', lowOnly: true }],
    queryFn: () => inventoryApi.listStock({ lowStockOnly: true }),
  });

  const sorted = useMemo(() => {
    if (!items) return [];
    return [...items].sort((a, b) => (a.available - a.lowStockThreshold) - (b.available - b.lowStockThreshold));
  }, [items]);

  const totalShortfall = sorted.reduce(
    (sum, i) => sum + Math.max(0, i.lowStockThreshold - i.available),
    0,
  );

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Low Stock</h2>
          <p>Products at or below their reorder threshold.</p>
        </div>
      </div>

      <div className="summary">
        <StatCard icon={<AlertTriangle size={22} />} label="Low Stock Items" value={sorted.length} tone="danger" />
        <StatCard icon={<AlertTriangle size={22} />} label="Total Shortfall" value={totalShortfall} tone="warning" />
      </div>

      {isLoading && <div className="skeleton skeleton-row" />}
      {error && <div className="error-box">Failed to load low-stock items.</div>}

      {sorted.length === 0 && !isLoading && (
        <div className="empty">
          <div className="empty-icon" style={{ background: 'var(--success-soft)', color: 'var(--success)' }}>
            <AlertTriangle size={30} />
          </div>
          <div className="empty-title">Nothing is low</div>
          <div className="empty-hint">Every product is above its reorder threshold.</div>
        </div>
      )}

      {sorted.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Location</th>
              <th className="num">Available</th>
              <th className="num">Threshold</th>
              <th className="num">Shortfall</th>
              <th className="num">On Order</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((i) => {
              const shortfall = Math.max(0, i.lowStockThreshold - i.available);
              return (
                <tr key={i.id}>
                  <td>
                    <div className="cell-product">
                      <strong>{i.productName}</strong>
                      <code>{i.productCode}</code>
                    </div>
                  </td>
                  <td><span className="mono">{i.locationCode}</span></td>
                  <td className="num" style={{ color: 'var(--danger)', fontWeight: 700 }}>{i.available}</td>
                  <td className="num">{i.lowStockThreshold}</td>
                  <td className="num">
                    <span className="qty-negative">−{shortfall}</span>
                  </td>
                  <td className="num">{i.onOrder > 0 ? i.onOrder : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </>
  );
}
