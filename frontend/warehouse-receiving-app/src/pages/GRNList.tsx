import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ClipboardList, AlertTriangle, CheckCircle2, Plus, ArrowRight } from 'lucide-react';
import { receivingApi } from '../api/receiving';
import { listReceivablePurchaseOrders, POOption } from '../api/purchaseOrders';
import { useToast } from '../components/ToastProvider';
import { StatCard } from '../components/StatCard';
import { formatDateTime } from '../utils/format';

export function GRNList() {
  const [status, setStatus] = useState('');
  const [open, setOpen] = useState(false);
  const [poId, setPoId] = useState('');
  const [notes, setNotes] = useState('');
  const { push } = useToast();
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['grns', status],
    queryFn: () => receivingApi.list(status ? { status } : undefined),
  });

  const { data: poOptions, isLoading: loadingPOs, error: poError } = useQuery({
    queryKey: ['receivable-pos'],
    queryFn: listReceivablePurchaseOrders,
    enabled: open,
    retry: false,
  });

  const selectedPO: POOption | null = useMemo(
    () => (poOptions ?? []).find((p) => p.id === poId) ?? null,
    [poOptions, poId],
  );

  const create = useMutation({
    mutationFn: () => receivingApi.createFromPO(poId, notes || undefined),
    onSuccess: (grn) => {
      qc.invalidateQueries({ queryKey: ['grns'] });
      push('GRN created from PO', 'success');
      setOpen(false);
      setPoId('');
      setNotes('');
      window.location.href = `/grn/${grn.id}`;
    },
    onError: (e: unknown) => push(e instanceof Error ? e.message : 'Failed to create GRN', 'error'),
  });

  const stats = useMemo(() => {
    if (!data) return { total: 0, drafts: 0, completed: 0, discrepancies: 0 };
    return {
      total: data.length,
      drafts: data.filter((g) => g.status === 'draft').length,
      completed: data.filter((g) => g.status === 'completed').length,
      discrepancies: data.filter((g) => g.shortages > 0 || g.overages > 0 || g.damages > 0).length,
    };
  }, [data]);

  const closeModal = () => {
    setOpen(false);
    setPoId('');
    setNotes('');
  };

  return <>
    <div className="page-header">
      <div><h2>Goods Received Notes</h2><p>Every dock receipt against an approved purchase order.</p></div>
      <button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> New receipt</button>
    </div>

    <div className="summary">
      <StatCard icon={<ClipboardList size={22} />} label="Total GRNs" value={stats.total} tone="primary" />
      <StatCard icon={<ClipboardList size={22} />} label="Drafts" value={stats.drafts} tone="warning" />
      <StatCard icon={<CheckCircle2 size={22} />} label="Completed" value={stats.completed} tone="success" />
      <StatCard icon={<AlertTriangle size={22} />} label="With Discrepancies" value={stats.discrepancies} tone={stats.discrepancies > 0 ? 'danger' : 'success'} />
    </div>

    <div className="filters">
      {[
        { v: '', l: 'All' },
        { v: 'draft', l: 'Drafts' },
        { v: 'completed', l: 'Completed' },
      ].map((s) => (
        <button key={s.v || 'all'} className={`btn-${status === s.v ? 'primary' : 'ghost'} btn-sm`} onClick={() => setStatus(s.v)}>{s.l}</button>
      ))}
    </div>

    {isLoading && <div className="skeleton skeleton-row" />}
    {error && <div className="error-box">Failed to load GRNs: {error instanceof Error ? error.message : 'unknown'}</div>}

    {data && data.length === 0 && !isLoading && !error && (
      <div className="empty">
        <div className="empty-icon"><ClipboardList size={30} /></div>
        <div className="empty-title">No {status || ''} receipts</div>
        <div className="empty-hint">Start a new receipt to record an incoming delivery.</div>
      </div>
    )}

    {data && data.length > 0 && (
      <table>
        <thead>
          <tr>
            <th>GRN</th>
            <th>PO</th>
            <th>Supplier</th>
            <th>Status</th>
            <th className="num">Shortages</th>
            <th className="num">Damages</th>
            <th>Created</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {data.map((g) => (
            <tr key={g.id}>
              <td><span className="mono" style={{ fontWeight: 700 }}>{g.id.slice(0, 8)}</span></td>
              <td><span className="mono">{g.purchaseOrderId.slice(0, 8)}</span></td>
              <td>{g.supplierName}</td>
              <td><span className={`badge badge-${g.status}`}>{g.status}</span></td>
              <td className="num">{g.shortages > 0 ? <span className="qty-bad">{g.shortages}</span> : '—'}</td>
              <td className="num">{g.damages > 0 ? <span className="qty-warn">{g.damages}</span> : '—'}</td>
              <td style={{ whiteSpace: 'nowrap', fontSize: 13, color: 'var(--muted)' }}>{formatDateTime(g.createdAt)}</td>
              <td>
                <Link to={`/grn/${g.id}`} className="btn-primary btn-sm">
                  {g.status === 'draft' ? 'Continue' : 'View'} <ArrowRight size={14} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )}

    {open && (
      <div className="modal-backdrop" onClick={closeModal}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <h3 className="modal-title">New goods received note</h3>
          <p className="modal-message">
            Start a receipt against an approved purchase order. Line items are pulled from the PO automatically.
          </p>

          {loadingPOs && <div className="skeleton skeleton-row" style={{ height: 42 }} />}

          {poError && (
            <div className="error-box">
              <AlertTriangle size={14} /> {poError instanceof Error ? poError.message : 'Could not load purchase orders.'}
            </div>
          )}

          {poOptions && (
            <>
              {poOptions.length === 0 ? (
                <div style={{ padding: 16, background: 'var(--bg)', borderRadius: 8, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
                  No approved or sent purchase orders are waiting to be received.
                  <br />
                  Approve a PO in Procurement first.
                </div>
              ) : (
                <div className="field">
                  <label>Purchase order <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <select value={poId} onChange={(e) => setPoId(e.target.value)}>
                    <option value="">— Select a purchase order —</option>
                    {poOptions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.id.slice(0, 8)} — {p.supplierName}
                      </option>
                    ))}
                  </select>
                  <p className="field-help">
                    {selectedPO
                      ? `PO reference: ${selectedPO.id.slice(0, 8)} · status ${selectedPO.status}`
                      : 'Only approved or sent POs are shown — those are the ones that can be received.'}
                  </p>
                </div>
              )}
            </>
          )}

          <div className="field">
            <label>Notes (optional)</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Delivery driver, truck number, arrival condition…" />
          </div>

          <div className="modal-actions">
            <button className="btn-secondary" onClick={closeModal}>Cancel</button>
            <button
              className="btn-primary"
              disabled={!poId || create.isPending || (poOptions?.length ?? 0) === 0}
              onClick={() => create.mutate()}
            >
              {create.isPending ? 'Creating…' : 'Start receipt'}
            </button>
          </div>
        </div>
      </div>
    )}
  </>;
}
