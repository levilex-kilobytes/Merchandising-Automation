import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ClipboardCheck, Clock, AlertTriangle, CheckCircle2, ArrowRight, Banknote } from 'lucide-react';
import { auditApi } from '../api/audit';
import { StatCard } from '../components/StatCard';
import { formatDateTime, formatISODate } from '../utils/format';

const fmt = (n: number) => `KES ${n.toFixed(2)}`;

type Filter = 'pending' | 'counted' | 'closed' | 'all';

export function ReconcileQueue() {
  const [filter, setFilter] = useState<Filter>('pending');
  const navigate = useNavigate();

  const { data: sessions, isLoading, error } = useQuery({
    queryKey: ['sessions', { status: '' }],
    queryFn: () => auditApi.listSessions(),
  });

  const all = sessions ?? [];

  const groups = useMemo(() => ({
    pending: all.filter((s) => s.status === 'open'),
    counted: all.filter((s) => s.status === 'counted'),
    closed: all.filter((s) => s.status === 'closed'),
  }), [all]);

  const visible = useMemo(() => {
    if (filter === 'all') return all;
    return groups[filter];
  }, [all, filter, groups]);

  const stats = useMemo(() => ({
    needsCount: groups.pending.length,
    readyToClose: groups.counted.length,
    totalExpected: groups.pending.reduce((sum, s) => sum + s.expectedTotal, 0),
  }), [groups]);

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Reconcile Registers</h2>
          <p>Every register session that needs counting or sign-off.</p>
        </div>
      </div>

      <div className="summary">
        <StatCard
          icon={<Clock size={22} />}
          label="Needs Counting"
          value={stats.needsCount}
          tone={stats.needsCount > 0 ? 'warning' : 'success'}
        />
        <StatCard
          icon={<AlertTriangle size={22} />}
          label="Counted, Awaiting Sign-off"
          value={stats.readyToClose}
          tone={stats.readyToClose > 0 ? 'warning' : 'success'}
        />
        <StatCard
          icon={<Banknote size={22} />}
          label="Expected Across Pending"
          value={fmt(stats.totalExpected)}
          tone="primary"
        />
      </div>

      <div className="filters">
        {([
          { v: 'pending' as Filter, l: 'Needs counting' },
          { v: 'counted' as Filter, l: 'Awaiting sign-off' },
          { v: 'closed' as Filter, l: 'Closed' },
          { v: 'all' as Filter, l: 'All' },
        ]).map(({ v, l }) => (
          <button
            key={v}
            className={`btn-${filter === v ? 'primary' : 'ghost'} btn-sm`}
            onClick={() => setFilter(v)}
          >
            {l}
            <span style={{ marginLeft: 6, opacity: 0.7 }}>
              {v === 'pending' ? groups.pending.length
                : v === 'counted' ? groups.counted.length
                : v === 'closed' ? groups.closed.length
                : all.length}
            </span>
          </button>
        ))}
      </div>

      {isLoading && <div className="skeleton skeleton-row" />}
      {error && (
        <div className="error-box">
          Failed to load register sessions: {error instanceof Error ? error.message : 'unknown'}
        </div>
      )}

      {!isLoading && visible.length === 0 && (
        <div className="empty">
          <div className="empty-icon">
            {filter === 'pending' ? <CheckCircle2 size={30} /> : <ClipboardCheck size={30} />}
          </div>
          <div className="empty-title">
            {filter === 'pending'
              ? 'Every register is counted'
              : filter === 'counted'
                ? 'Nothing awaiting sign-off'
                : filter === 'closed'
                  ? 'No closed sessions yet'
                  : 'No register sessions'}
          </div>
          <div className="empty-hint">
            {filter === 'pending'
              ? 'Open sessions will appear here.'
              : 'Try a different filter.'}
          </div>
        </div>
      )}

      {visible.length > 0 && (
        <div className="reconcile-queue">
          {visible.map((s) => {
            const needsCount = s.status === 'open';
            const isClosed = s.status === 'closed';
            const short = s.difference < 0;
            const balanced = s.difference === 0;

            return (
              <div
                key={s.id}
                className={`reconcile-card ${isClosed ? 'closed' : needsCount ? 'pending' : 'counted'}`}
              >
                <div className="reconcile-card-header">
                  <div>
                    <div className="reconcile-card-register">{s.registerCode}</div>
                    <div className="reconcile-card-store">
                      {s.storeLocation} · {formatISODate(s.businessDate)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className={`badge badge-${s.status}`}>
                      {s.status === 'open' ? 'Needs count' : s.status === 'counted' ? 'Awaiting sign-off' : 'Closed'}
                    </span>
                  </div>
                </div>

                <div className="reconcile-card-totals">
                  <div className="reconcile-total-item">
                    <span className="reconcile-total-label">Expected</span>
                    <span className="reconcile-total-value">{fmt(s.expectedTotal)}</span>
                  </div>
                  <div className="reconcile-total-item">
                    <span className="reconcile-total-label">Counted</span>
                    <span className="reconcile-total-value">
                      {s.countedTotal > 0 ? fmt(s.countedTotal) : '—'}
                    </span>
                  </div>
                  <div className="reconcile-total-item">
                    <span className="reconcile-total-label">Difference</span>
                    <span
                      className={`reconcile-total-value ${balanced ? 'diff-zero' : short ? 'diff-negative' : 'diff-positive'}`}
                    >
                      {balanced ? '—' : `${short ? '−' : '+'}${fmt(Math.abs(s.difference))}`}
                    </span>
                  </div>
                </div>

                <div className="reconcile-card-footer">
                  {isClosed ? (
                    <span style={{ fontSize: 13, color: 'var(--muted)' }}>
                      Closed {s.closedAt ? formatDateTime(s.closedAt) : '—'}
                    </span>
                  ) : (
                    <button
                      className={`btn-${needsCount ? 'primary' : 'success'} btn-lg`}
                      style={{ width: '100%' }}
                      onClick={() => navigate(`/reconcile/${s.id}`)}
                    >
                      {needsCount ? (
                        <>
                          <ClipboardCheck size={18} /> Count drawer
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={18} /> Sign off and close
                        </>
                      )}
                      <ArrowRight size={16} style={{ marginLeft: 6 }} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
