import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, MapPin, Package, X } from 'lucide-react';
import { warehouseExtApi } from '../api/warehouse';
import { EmptyState } from '../components/EmptyState';
import { Skeleton } from '../components/Skeleton';
import { useToast } from '../components/ToastProvider';

export function Lookup() {
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const { push } = useToast();

  const { data, isLoading, error } = useQuery({
    queryKey: ['lookup', submitted],
    queryFn: () => warehouseExtApi.findBySku(submitted),
    enabled: submitted.length > 0,
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) {
      push('Enter a SKU to search', 'error');
      return;
    }
    setSubmitted(q);
  };

  const clear = () => {
    setQuery('');
    setSubmitted('');
  };

  const totalUnits = data?.reduce((sum, b) => sum + b.quantity, 0) ?? 0;

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Find a SKU</h2>
          <p>Every bin currently holding a given product.</p>
        </div>
      </div>

      <form onSubmit={submit} className="lookup-form">
        <div className="scanner-input-wrap">
          <Search className="scanner-icon" size={22} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Scan or type a SKU…"
            autoComplete="off"
            spellCheck={false}
            className="scanner-input"
            style={{ fontFamily: 'SF Mono, Menlo, monospace' }}
            autoFocus
          />
          {query && (
            <button type="button" className="scanner-clear" onClick={clear} aria-label="Clear">
              <X size={18} />
            </button>
          )}
        </div>
        <button type="submit" className="btn-primary" style={{ minWidth: 120 }}>
          Search
        </button>
      </form>

      {isLoading && (
        <div className="skeleton-rows" style={{ marginTop: 20 }}>
          <Skeleton className="skeleton-row" />
          <Skeleton className="skeleton-row" />
        </div>
      )}

      {error && (
        <div className="error-box" style={{ marginTop: 20 }}>
          Search failed. Try again.
        </div>
      )}

      {submitted && data && data.length === 0 && (
        <EmptyState
          icon={<Package size={30} />}
          title={`No bins hold ${submitted}`}
          hint="Either the SKU doesn't exist, or all units are in transit / already picked."
        />
      )}

      {submitted && data && data.length > 0 && (
        <>
          <div className="lookup-summary">
            <div className="lookup-summary-item">
              <span className="lookup-summary-num">{data.length}</span>
              <span className="lookup-summary-label">bin{data.length > 1 ? 's' : ''}</span>
            </div>
            <div className="lookup-summary-item">
              <span className="lookup-summary-num">{totalUnits}</span>
              <span className="lookup-summary-label">units on hand</span>
            </div>
          </div>

          <ul className="lookup-results">
            {data.map(({ location, quantity }) => {
              const pct = location.capacity === 0 ? 0
                : Math.round((location.used / location.capacity) * 100);
              return (
                <li key={location.id} className="lookup-result">
                  <div className="lookup-result-head">
                    <span className="lookup-result-code">
                      <MapPin size={16} /> <code>{location.code}</code>
                    </span>
                    <span className="lookup-result-qty">
                      <strong>{quantity}</strong> units here
                    </span>
                  </div>
                  <div className="lookup-result-meta">
                    Zone {location.zone} · Aisle {location.aisle} ·
                    Rack {location.rack} · Shelf {location.shelf}
                  </div>
                  <div className="capacity-wrap" style={{ marginTop: 10 }}>
                    <div className="capacity-label">
                      <span>Bin {location.used} / {location.capacity}</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="capacity-bar">
                      <div
                        className={`capacity-bar-fill ${pct >= 90 ? 'capacity-full' : pct >= 70 ? 'capacity-warn' : 'capacity-ok'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </>
  );
}
