import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ClipboardCheck, AlertTriangle, CheckCircle2, Clock, Plus, ArrowRight } from 'lucide-react';
import { auditApi } from '../api/audit';
import { useToast } from '../components/ToastProvider';
import { StatCard } from '../components/StatCard';

const fmt = (n: number) => `KES ${n.toFixed(2)}`;

export function SessionsList() {
  const [status, setStatus] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [registerCode, setRegisterCode] = useState('');
  const [businessDate, setBusinessDate] = useState(new Date().toISOString().slice(0, 10));
  const { push } = useToast();
  const qc = useQueryClient();

  const { data: sessions, isLoading, error } = useQuery({
    queryKey: ['sessions', { status }],
    queryFn: () => auditApi.listSessions({ status: status || undefined }),
  });

  const { data: registers } = useQuery({
    queryKey: ['registers'],
    queryFn: () => auditApi.listRegisters(),
  });

  const open = useMutation({
    mutationFn: () => auditApi.openSession({
      registerCode,
      storeLocation: 'Store #1',
      businessDate,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sessions'] });
      push('Session opened', 'success');
      setOpenModal(false);
      setRegisterCode('');
    },
    onError: (e: unknown) => push(e instanceof Error ? e.message : 'Failed', 'error'),
  });

  const stats = useMemo(() => {
    if (!sessions) return { total: 0, open: 0, counted: 0, closed: 0, netDiff: 0 };
    return {
      total: sessions.length,
      open: sessions.filter((s) => s.status === 'open').length,
      counted: sessions.filter((s) => s.status === 'counted').length,
      closed: sessions.filter((s) => s.status === 'closed').length,
      netDiff: sessions.reduce((sum, s) => sum + s.difference, 0),
    };
  }, [sessions]);

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Register Sessions</h2>
          <p>Daily reconciliation state for every register.</p>
        </div>
        <button className="btn-primary" onClick={() => setOpenModal(true)}>
          <Plus size={16} /> Open session
        </button>
      </div>

      <div className="summary">
        <StatCard icon={<Clock size={22} />} label="Open" value={stats.open} tone="primary" />
        <StatCard icon={<AlertTriangle size={22} />} label="Counted" value={stats.counted} tone="warning" />
        <StatCard icon={<CheckCircle2 size={22} />} label="Closed" value={stats.closed} tone="success" />
        <StatCard
          icon={<ClipboardCheck size={22} />}
          label="Net Variance"
          value={fmt(stats.netDiff)}
          tone={stats.netDiff === 0 ? 'success' : stats.netDiff < 0 ? 'danger' : 'warning'}
        />
      </div>

      <div style={{ marginBottom: 20, maxWidth: 260 }}>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="counted">Counted</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {isLoading && <div className="skeleton skeleton-row" />}
      {error && <div className="error-box">Failed to load sessions.</div>}

      {sessions && sessions.length === 0 && (
        <div className="empty">
          <div className="empty-icon"><ClipboardCheck size={30} /></div>
          <div className="empty-title">No sessions yet</div>
          <div className="empty-hint">Open a session to start tracking a register's daily totals.</div>
        </div>
      )}

      {sessions && sessions.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Register</th>
              <th>Store</th>
              <th>Expected</th>
              <th>Counted</th>
              <th>Difference</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id}>
                <td>{s.businessDate}</td>
                <td><span className="mono">{s.registerCode}</span></td>
                <td>{s.storeLocation}</td>
                <td><span className="session-total">{fmt(s.expectedTotal)}</span></td>
                <td><span className="session-total">{s.countedTotal > 0 ? fmt(s.countedTotal) : '—'}</span></td>
                <td>
                  <span className={s.difference === 0 ? 'diff-zero' : s.difference > 0 ? 'diff-positive' : 'diff-negative'}>
                    {s.difference === 0 ? '—' : `${s.difference > 0 ? '+' : ''}${fmt(s.difference)}`}
                  </span>
                </td>
                <td><span className={`badge badge-${s.status}`}>{s.status}</span></td>
                <td>
                  {s.status !== 'closed' && (
                    <Link to={`/reconcile/${s.id}`} className="btn-primary btn-sm">
                      {s.status === 'open' ? 'Reconcile' : 'Close'} <ArrowRight size={14} />
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {openModal && (
        <div className="modal-backdrop" onClick={() => setOpenModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Open register session</h3>
            <p className="modal-message">Start tracking the expected total for this register and date.</p>

            <div className="field">
              <label>Register</label>
              <select value={registerCode} onChange={(e) => setRegisterCode(e.target.value)}>
                <option value="">Select a register…</option>
                {registers?.map((r) => (
                  <option key={r.id} value={r.code}>{r.code} — {r.storeLocation}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Business date</label>
              <input type="date" value={businessDate} onChange={(e) => setBusinessDate(e.target.value)} />
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setOpenModal(false)}>Cancel</button>
              <button
                className="btn-primary"
                disabled={!registerCode || open.isPending}
                onClick={() => open.mutate()}
              >
                {open.isPending ? 'Opening…' : 'Open session'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
