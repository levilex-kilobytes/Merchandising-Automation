import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookText, X, Search } from 'lucide-react';
import { financeApi } from '../api/finance';
import { JournalEntry } from '../api/types';
import { formatISODate } from '../utils/format';

const fullMoney = (n: number) => `KES ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function Ledger() {
  const [referenceType, setReferenceType] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [search, setSearch] = useState('');
  const [openEntry, setOpenEntry] = useState<JournalEntry | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['entries', { referenceType, fromDate, toDate }],
    queryFn: () => financeApi.listEntries({
      referenceType: referenceType || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
    }),
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter((e) =>
      e.entryNumber.toLowerCase().includes(q) ||
      (e.description ?? '').toLowerCase().includes(q) ||
      (e.referenceId ?? '').toLowerCase().includes(q),
    );
  }, [data, search]);

  const { data: fullEntry } = useQuery({
    queryKey: ['entry', openEntry?.id],
    queryFn: () => financeApi.getEntry(openEntry!.id),
    enabled: !!openEntry,
  });

  const reset = () => {
    setReferenceType('');
    setFromDate('');
    setToDate('');
    setSearch('');
  };

  const hasFilters = referenceType || fromDate || toDate || search;

  return (
    <>
      <div className="page-header">
        <div>
          <h2>General Ledger</h2>
          <p>Every posted journal entry, newest first.</p>
        </div>
      </div>

      <div className="filters">
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by entry number, description, or reference…"
            style={{ paddingLeft: 36, paddingRight: search ? 36 : 12 }}
          />
          {search && (
            <button className="btn-ghost btn-sm" onClick={() => setSearch('')} style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', minHeight: 28, padding: 4 }}>
              <X size={14} />
            </button>
          )}
        </div>
        <select value={referenceType} onChange={(e) => setReferenceType(e.target.value)}>
          <option value="">All sources</option>
          <option value="grn">Goods received (GRN)</option>
          <option value="sale">Sale</option>
          <option value="return">Return</option>
          <option value="bill">Supplier payment</option>
          <option value="register_close">Register close</option>
        </select>
        <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} title="From date" />
        <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} title="To date" />
        {hasFilters && (
          <button className="btn-ghost btn-sm" onClick={reset}>Clear</button>
        )}
      </div>

      {isLoading && <div className="skeleton skeleton-row" />}
      {error && <div className="error-box">Failed to load ledger: {error instanceof Error ? error.message : 'unknown'}</div>}

      {!isLoading && filtered.length === 0 && (
        <div className="empty">
          <div className="empty-icon"><BookText size={30} /></div>
          <div className="empty-title">{hasFilters ? 'No matching entries' : 'No journal entries yet'}</div>
          <div className="empty-hint">
            {hasFilters
              ? 'Try adjusting the filters.'
              : 'Entries post automatically when goods are received, sales are made, or registers close.'}
          </div>
        </div>
      )}

      {filtered.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Entry #</th>
              <th>Date</th>
              <th>Description</th>
              <th>Source</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => (
              <tr key={e.id}>
                <td><span className="mono" style={{ fontWeight: 700 }}>{e.entryNumber}</span></td>
                <td style={{ whiteSpace: 'nowrap' }}>{formatISODate(e.entryDate)}</td>
                <td>{e.description ?? '—'}</td>
                <td>
                  {e.referenceType ? (
                    <span className="badge badge-posted" style={{ textTransform: 'none' }}>{e.referenceType}</span>
                  ) : '—'}
                </td>
                <td><span className={`badge badge-${e.status}`}>{e.status}</span></td>
                <td>
                  <button className="btn-primary btn-sm" onClick={() => setOpenEntry(e)}>View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {openEntry && (
        <div className="modal-backdrop" onClick={() => setOpenEntry(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ width: 'min(100%, 720px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <h3 className="modal-title">{fullEntry?.entryNumber ?? openEntry.entryNumber}</h3>
                <p className="modal-message" style={{ marginBottom: 0 }}>
                  {formatISODate(fullEntry?.entryDate ?? openEntry.entryDate)}
                  {fullEntry?.referenceType && (
                    <> · source <code>{fullEntry.referenceType}</code></>
                  )}
                </p>
              </div>
              <button className="btn-ghost btn-sm" onClick={() => setOpenEntry(null)} aria-label="Close"><X size={16} /></button>
            </div>

            {(fullEntry?.description ?? openEntry.description) && (
              <div style={{ padding: 12, background: 'var(--bg)', borderRadius: 8, fontSize: 14, marginBottom: 16 }}>
                {fullEntry?.description ?? openEntry.description}
              </div>
            )}

            {!fullEntry && <div className="skeleton skeleton-row" />}

            {fullEntry?.lines && (
              <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                <div className="entry-line" style={{ background: '#f8fafc', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6, color: 'var(--muted)' }}>
                  <div>Account</div>
                  <div>Name</div>
                  <div style={{ textAlign: 'right' }}>Debit</div>
                  <div style={{ textAlign: 'right' }}>Credit</div>
                </div>
                {fullEntry.lines.map((l) => (
                  <div key={l.id} className={`entry-line ${l.debit > 0 ? 'debit' : l.credit > 0 ? 'credit' : ''}`}>
                    <div className="mono" style={{ fontWeight: 700 }}>{l.accountCode}</div>
                    <div>{l.accountName}</div>
                    <div className="amount" style={{ textAlign: 'right' }}>
                      {l.debit > 0 ? fullMoney(l.debit) : '—'}
                    </div>
                    <div className="amount" style={{ textAlign: 'right' }}>
                      {l.credit > 0 ? fullMoney(l.credit) : '—'}
                    </div>
                  </div>
                ))}
                <div className="entry-line" style={{ background: '#f8fafc', fontWeight: 800, borderTop: '2px solid var(--border)' }}>
                  <div></div>
                  <div style={{ textTransform: 'uppercase', fontSize: 11, letterSpacing: 0.6, color: 'var(--muted)' }}>Totals</div>
                  <div className="amount mono" style={{ textAlign: 'right' }}>
                    {fullMoney(fullEntry.lines.reduce((s, l) => s + l.debit, 0))}
                  </div>
                  <div className="amount mono" style={{ textAlign: 'right' }}>
                    {fullMoney(fullEntry.lines.reduce((s, l) => s + l.credit, 0))}
                  </div>
                </div>
              </div>
            )}

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setOpenEntry(null)} style={{ flex: 1 }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
