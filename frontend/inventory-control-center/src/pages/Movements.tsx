import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, Search, X } from 'lucide-react';
import { inventoryApi } from '../api/inventory';
import { StockMovement } from '../api/types';
import { formatDateTime, formatDate } from '../utils/format';

const movementLabel: Record<StockMovement['movementType'], string> = {
  received: 'Received',
  sold: 'Sold',
  returned: 'Returned',
  adjusted: 'Adjusted',
  transferred: 'Transferred',
};

export function Movements() {
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');

  const { data: locations } = useQuery({
    queryKey: ['locations'],
    queryFn: () => inventoryApi.listLocations().catch(() => []),
  });

  const { data: movements, isLoading, error } = useQuery({
    queryKey: ['movements', { location }],
    queryFn: () => inventoryApi.listMovements({ locationCode: location || undefined }),
    retry: false,
  });

  const filtered = useMemo(() => {
    if (!movements) return [];
    const q = search.trim().toLowerCase();
    if (!q) return movements;
    return movements.filter((m) =>
      m.productCode.toLowerCase().includes(q) ||
      (m.referenceId ?? '').toLowerCase().includes(q) ||
      (m.notes ?? '').toLowerCase().includes(q)
    );
  }, [movements, search]);

  const endpointMissing = error instanceof Error && /404/.test(error.message);

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Stock Movements</h2>
          <p>Every change to on-hand quantity, in chronological order.</p>
        </div>
      </div>

      <div className="filters">
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product, reference, or note…"
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
          {locations?.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>

      {isLoading && <div className="skeleton skeleton-row" />}

      {endpointMissing && (
        <div className="empty">
          <div className="empty-icon"><Activity size={30} /></div>
          <div className="empty-title">Movements endpoint unavailable</div>
          <div className="empty-hint">
            The Inventory service doesn't expose a movements route yet. Add
            GET /api/v1/stock/movements to the backend and this page will populate.
          </div>
        </div>
      )}

      {error && !endpointMissing && (
        <div className="error-box">Failed to load movements: {error instanceof Error ? error.message : 'unknown error'}</div>
      )}

      {movements && filtered.length === 0 && (
        <div className="empty">
          <div className="empty-icon"><Activity size={30} /></div>
          <div className="empty-title">{search || location ? 'No matching movements' : 'No movements yet'}</div>
          <div className="empty-hint">
            {search || location
              ? 'Try clearing a filter or searching for a different product.'
              : 'Every receipt, sale, return, and adjustment will show up here.'}
          </div>
        </div>
      )}

      {filtered.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>When</th>
              <th>Type</th>
              <th>Product</th>
              <th>Location</th>
              <th className="num">Change</th>
              <th>Reference</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => {
              const positive = m.quantity > 0;
              return (
                <tr key={m.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{formatDateTime(m.createdAt)}</td>
                  <td><span className={`badge badge-${m.movementType}`}>{movementLabel[m.movementType]}</span></td>
                  <td><span className="mono">{m.productCode}</span></td>
                  <td><span className="mono">{m.locationCode}</span></td>
                  <td className={`num ${positive ? 'qty-positive' : m.quantity < 0 ? 'qty-negative' : 'qty-zero'}`}>
                    {positive ? '+' : ''}{m.quantity}
                  </td>
                  <td>
                    {m.referenceId ? (
                      <code title={m.referenceType ?? ''}>{m.referenceId.slice(0, 8)}…</code>
                    ) : '—'}
                  </td>
                  <td style={{ color: 'var(--muted)', fontSize: 13 }}>{m.notes ?? '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </>
  );
}
