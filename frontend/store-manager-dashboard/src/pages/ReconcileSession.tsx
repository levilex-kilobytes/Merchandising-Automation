import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, AlertTriangle, Banknote, CreditCard, Coins } from 'lucide-react';
import { auditApi } from '../api/audit';
import { useToast } from '../components/ToastProvider';

const fmt = (n: number) => `KES ${n.toFixed(2)}`;

export function ReconcileSession() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { push } = useToast();

  const { data: session, isLoading, error } = useQuery({
    queryKey: ['session', id],
    queryFn: () => auditApi.getSession(id),
  });

  const [cash, setCash] = useState(0);
  const [card, setCard] = useState(0);
  const [other, setOther] = useState(0);
  const [explanation, setExplanation] = useState('');
  const [signedOffBy, setSignedOffBy] = useState('');

  useEffect(() => {
    if (session && session.countedTotal > 0) {
      setCash(session.countedTotal);
    }
  }, [session]);

  const countedTotal = Number((cash + card + other).toFixed(2));
  const expectedTotal = session?.expectedTotal ?? 0;
  const difference = Number((countedTotal - expectedTotal).toFixed(2));

  const recordCount = useMutation({
    mutationFn: () => auditApi.recordCount(id, {
      cashCounted: cash,
      cardCounted: card,
      otherCounted: other,
      countedBy: signedOffBy || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['session', id] });
      qc.invalidateQueries({ queryKey: ['sessions'] });
      push('Count recorded', 'success');
    },
    onError: (e: unknown) => push(e instanceof Error ? e.message : 'Failed', 'error'),
  });

  const close = useMutation({
    mutationFn: () => auditApi.closeSession(id, {
      countedTotal,
      signedOffBy: signedOffBy || 'Manager',
      explanation: explanation || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sessions'] });
      push('Session closed', 'success');
      navigate('/');
    },
    onError: (e: unknown) => push(e instanceof Error ? e.message : 'Failed', 'error'),
  });

  if (isLoading) return <div className="skeleton skeleton-row" />;
  if (error || !session) return <div className="error-box">Session not found.</div>;

  const needsExplanation = difference !== 0;
  const isCounted = session.status === 'counted';
  const isClosed = session.status === 'closed';

  return (
    <>
      <div className="page-header">
        <div>
          <button className="btn-ghost btn-sm" onClick={() => navigate('/')} style={{ marginBottom: 8 }}>
            <ArrowLeft size={14} /> Back to sessions
          </button>
          <h2>{session.registerCode} — {session.businessDate}</h2>
          <p>{session.storeLocation} · Status: {session.status}</p>
        </div>
      </div>

      <div className="reconciliation-panel">
        <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 700 }}>Enter physical count</h3>

        <div className="reconciliation-grid">
          <div className="field">
            <label><Banknote size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Cash</label>
            <input
              type="number" min="0" step="0.01" value={cash}
              onChange={(e) => setCash(Number(e.target.value) || 0)}
              className="reconciliation-input"
              disabled={isClosed}
            />
          </div>
          <div className="field">
            <label><CreditCard size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Card slips</label>
            <input
              type="number" min="0" step="0.01" value={card}
              onChange={(e) => setCard(Number(e.target.value) || 0)}
              className="reconciliation-input"
              disabled={isClosed}
            />
          </div>
          <div className="field">
            <label><Coins size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Other</label>
            <input
              type="number" min="0" step="0.01" value={other}
              onChange={(e) => setOther(Number(e.target.value) || 0)}
              className="reconciliation-input"
              disabled={isClosed}
            />
          </div>
        </div>

        <div className="reconciliation-summary">
          <div className="reconciliation-row">
            <span>Expected (from POS sales)</span>
            <span className="value">{fmt(expectedTotal)}</span>
          </div>
          <div className="reconciliation-row">
            <span>Counted</span>
            <span className="value">{fmt(countedTotal)}</span>
          </div>
          <div className="reconciliation-row total">
            <span>{difference === 0 ? 'Balanced' : difference > 0 ? 'Overage' : 'Shortage'}</span>
            <span className="value" style={{ color: difference === 0 ? 'var(--success)' : difference > 0 ? 'var(--success)' : 'var(--danger)' }}>
              {difference > 0 ? '+' : ''}{fmt(difference)}
            </span>
          </div>
        </div>

        {!isClosed && !isCounted && (
          <button
            className="btn-primary btn-lg"
            onClick={() => recordCount.mutate()}
            disabled={recordCount.isPending}
            style={{ marginTop: 16 }}
          >
            {recordCount.isPending ? 'Recording…' : 'Record count'}
          </button>
        )}
      </div>

      {(isCounted || isClosed) && (
        <div className="card">
          <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 700 }}>Manager sign-off</h3>

          <div className="field">
            <label>Signed off by</label>
            <input
              value={signedOffBy}
              onChange={(e) => setSignedOffBy(e.target.value)}
              placeholder="Manager name"
              disabled={isClosed}
            />
          </div>

          {needsExplanation && (
            <div className="field">
              <label>Explanation (required for overage or shortage)</label>
              <textarea
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="e.g. Cashier forgot to log a KES 50 payout for cleaning supplies."
                rows={3}
                disabled={isClosed}
              />
            </div>
          )}

          {difference === 0 && (
            <div className="overage-banner">
              <CheckCircle2 size={18} /> Balanced — ready to close.
            </div>
          )}
          {difference !== 0 && (
            <div className={difference > 0 ? 'overage-banner' : 'shortage-banner'}>
              <AlertTriangle size={18} />
              {difference > 0 ? `Overage of ${fmt(difference)} must be explained.` : `Shortage of ${fmt(Math.abs(difference))} must be explained.`}
            </div>
          )}

          {!isClosed && (
            <button
              className="btn-success btn-lg"
              onClick={() => close.mutate()}
              disabled={close.isPending || (needsExplanation && !explanation.trim())}
              style={{ marginTop: 16 }}
            >
              {close.isPending ? 'Closing…' : 'Sign off and close session'}
            </button>
          )}

          {isClosed && (
            <div style={{ marginTop: 16, color: 'var(--muted)', fontSize: 14 }}>
              Closed at {session.closedAt ? new Date(session.closedAt).toLocaleString() : '—'}
            </div>
          )}
        </div>
      )}
    </>
  );
}
