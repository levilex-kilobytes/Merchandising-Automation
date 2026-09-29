import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Package, Boxes, DollarSign, AlertTriangle, Search, SlidersHorizontal, X } from 'lucide-react';
import { inventoryApi } from '../api/inventory';
import { StockItem } from '../api/types';
import { StatCard } from '../components/StatCard';
import { AdjustStockModal } from '../components/AdjustStockModal';

const fmt = (n: number) => `KES ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function Stock() {
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [lowOnly, setLowOnly] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState<{ productCode: string; locationCode: string } | null>(null);

  const { data: locations } = useQuery({
    queryKey: ['locations'],
    queryFn: () => inventoryApi.listLocations(),
  });

  const { data: items, isLoading, error } = useQuery({
    queryKey: ['stock', { location, lowOnly }],
    queryFn: () => inventoryApi.listStock({ locationCode: location || undefined, lowStockOnly: lowOnly || undefined }),
  });

  const filtered = useMemo(() => {
    if (!items) return [];
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) =>
      i.productCode.toLowerCase().includes(q) || i.productName.toLowerCase().includes(q)
    );
  }, [items, search]);

  const stats = useMemo(() => {
    if (!items) return { skus: 0, units: 0, valuation: 0, low: 0 };
    return {
      skus: items.length,
      units: items.reduce((s, i) => s + i.onHand, 0),
      valuation: items.reduce((s, i) => s + i.valuation, 0),
      low: items.filter((i) => i.available <= i.lowStockThreshold).length,
    };
  }, [items]);

  const openAdjust = (item?: StockItem) => {
    setAdjustTarget(item ? { productCode: item.productCode, locationCode: item.locationCode } : null);
    setAdjustOpen(true);
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Stock</h2>
          <p>Real-time position of every product across every location.</p>
        </div>
        <button className="btn-primary" onClick={() => openAdjust()}>
          <SlidersHorizontal size={16} /> Adjust stock
        </button>
      </div>

      <div className="summary">
        <StatCard icon={<Package size={22} />} label="Stock Items" value={stats.skus} tone="primary" />
        <StatCard icon={<Boxes size={22} />} label="Total Units" value={stats.units} tone="success" />
        <StatCard icon={<DollarSign size={22} />} label="Total Valuation" value={fmt(stats.valuation)} tone="primary" />
        <StatCard icon={<AlertTriangle size={22} />} label="Low Stock" value={stats.low} tone={stats.low > 0 ? 'danger' : 'success'} />
      </div>

      <div className="filters">
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product code or name…"
            style={{ paddingLeft: 36, paddingRight: search ? 36 : 12 }}
          />
          {search && (
            <button
              className="btn-ghost btn-sm"
              onClick={() => setSearch('')}
              style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', minHeight: 28, padding: 4 }}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <select value={location} onChange={(e) => setLocation(e.target.value)}>
          <option value="">All locations</option>
          {locations?.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>

        <label className="checkbox-wrap">
          <input type="checkbox" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} />
          Low stock only
        </label>
      </div>

      {isLoading && <div className="skeleton skeleton-row" />}
      {error && <div className="error-box">Failed to load stock.</div>}

      {items && filtered.length === 0 && (
        <div className="empty">
          <div className="empty-icon"><Package size={30} /></div>
          <div className="empty-title">{search || location || lowOnly ? 'No matching stock' : 'No stock yet'}</div>
          <div className="empty-hint">
            {search || location || lowOnly
              ? 'Try clearing a filter or searching for a different product.'
              : 'Stock appears here once goods are received or adjusted in.'}
          </div>
        </div>
      )}

      {filtered.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Location</th>
              <th className="num">On Hand</th>
              <th className="num">Allocated</th>
              <th className="num">Available</th>
              <th className="num">On Order</th>
              <th className="num">Unit Cost</th>
              <th className="num">Valuation</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => {
              const isLow = item.available <= item.lowStockThreshold;
              const allocatedPct = item.onHand > 0 ? (item.allocated / item.onHand) * 100 : 0;
              return (
                <tr key={item.id}>
                  <td>
                    <div className="cell-product">
                      <strong>{item.productName}</strong>
                      <code>{item.productCode}</code>
                    </div>
                  </td>
                  <td><span className="mono">{item.locationCode}</span></td>
                  <td className="num">
                    <div>{item.onHand}</div>
                    {item.allocated > 0 && (
                      <div className="allocation-bar" title={`${item.allocated} allocated`}>
                        <div className="allocation-fill-available" style={{ width: `${100 - allocatedPct}%` }} />
                        <div className="allocation-fill-allocated" style={{ width: `${allocatedPct}%` }} />
                      </div>
                    )}
                  </td>
                  <td className="num">{item.allocated}</td>
                  <td className="num"><strong>{item.available}</strong></td>
                  <td className="num">{item.onOrder > 0 ? item.onOrder : '—'}</td>
                  <td className="num">{fmt(item.unitCost)}</td>
                  <td className="num">{fmt(item.valuation)}</td>
                  <td>
                    <span className={`badge ${isLow ? 'badge-low' : 'badge-ok'}`}>
                      {isLow ? 'Low' : 'OK'}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn-ghost btn-sm"
                      onClick={() => openAdjust(item)}
                    >
                      Adjust
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <AdjustStockModal
        open={adjustOpen}
        onClose={() => { setAdjustOpen(false); setAdjustTarget(null); }}
        initialProductCode={adjustTarget?.productCode}
        initialLocationCode={adjustTarget?.locationCode}
      />
    </>
  );
}
