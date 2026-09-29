import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, MapPin, Package, X, AlertTriangle } from 'lucide-react';
import { findBySku } from '../api/lookup';
import { useToast } from '../components/ToastProvider';

export function Lookup() {
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const { push } = useToast();

  const { data, isLoading, error } = useQuery({
    queryKey: ['lookup', submitted],
    queryFn: () => findBySku(submitted),
    enabled: submitted.length > 0,
    retry: false,
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

  const results = data ?? [];
  const totalUnits = results.reduce((s, r) => s + r.quantity, 0);

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
          <div className="skeleton skeleton-row" />
          <div className="skeleton skeleton-row" />
        </div>
      )}

      {error && (
        <div className="error-box" style={{ marginTop: 20 }}>
          <AlertTriangle size={16} />
          {error instanceof Error ? error.message : 'Search failed — is the Inventory service running?'}
        </div>
      )}

      {submitted && !isLoading && !error && results.length === 0 && (
        <div className="empty">
          <div className="empty-icon"><Package size={30} /></div>
          <div className="empty-title">No bins hold {submitted}</div>
          <div className="empty-hint">
            Either the SKU doesn't exist in Inventory, or all units are in transit / already picked.
          </div>
        </div>
      )}

      {submitted && results.length > 0 && (
        <>
          <div className="lookup-summary">
            <div className="lookup-summary-item">
              <span className="lookup-summary-num">{results.length}</span>
              <span className="lookup-summary-label">bin{results.length > 1 ? 's' : ''}</span>
            </div>
            <div className="lookup-summary-item">
              <span className="lookup-summary-num">{totalUnits}</span>
              <span className="lookup-summary-label">units on hand</span>
            </div>
          </div>

          <ul className="lookup-results">
            {results.map((r, i) => {
              const bin = r.bin;
              const pct = bin.capacity === 0 ? 0 : Math.round((bin.used / bin.capacity) * 100);
              return (
                <li key={`${bin.code}-${i}`} className="lookup-result">
                  <div className="lookup-result-head">
                    <span className="lookup-result-code">
                      <MapPin size={16} />
                      <code>{bin.code}</code>
                    </span>
                    <span className="lookup-result-qty">
                      <strong>{r.quantity}</strong> unit{r.quantity === 1 ? '' : 's'} here
                    </span>
                  </div>
                  <div className="lookup-result-meta">
                    {bin.zone !== '—' ? (
                      <>Zone {bin.zone} · Aisle {bin.aisle} · Rack {bin.rack} · Shelf {bin.shelf}</>
                    ) : (
                      <>Location details not found in Warehouse Ops (bin <code>{bin.code}</code> may not exist there)</>
                    )}
                  </div>
                  {bin.capacity > 0 && (
                    <div className="capacity-wrap" style={{ marginTop: 10 }}>
                      <div className="capacity-label">
                        <span>Bin {bin.used} / {bin.capacity}</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="capacity-bar">
                        <div
                          className={`capacity-bar-fill ${pct >= 90 ? 'capacity-full' : pct >= 70 ? 'capacity-warn' : 'capacity-ok'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </>
  );
}
