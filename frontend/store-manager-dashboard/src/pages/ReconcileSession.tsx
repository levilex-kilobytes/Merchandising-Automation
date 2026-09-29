import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, CheckCircle2, AlertTriangle, Banknote, CreditCard, Coins, X,
} from 'lucide-react';
import { auditApi } from '../api/audit';
import { useToast } from '../components/ToastProvider';
import { formatDateTime, formatISODate } from '../utils/format';

const fmt = (n: number) => `KES ${n.toFixed(2)}`;
const parseNum = (raw: string): number => {
  if (raw.trim() === '') return NaN;
  const n = Number(raw);
  return Number.isFinite(n) ? n : NaN;
};

export function ReconcileSession() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { push } = useToast();

  const { data: session, isLoading, error } = useQuery({
    queryKey: ['session', id],
    queryFn: () => auditApi.getSession(id),
  });

  // Inputs kept as strings so we can distinguish "0" from "" (missing)
  const [cash, setCash] = useState('');
  const [card, setCard] = useState('');
  const [other, setOther] = useState('');
  const [signedOffBy, setSignedOffBy] = useState('');
  const [explanation, setExplanation] = useState('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [closeAttempted, setCloseAttempted] = useState(false);

  // Prefill from existing session when status is counted
  useEffect(() => {
    if (!session) return;
    if (session.status !== 'open' && session.countedTotal > 0) {
      setCash(String(session.countedTotal));
    }
  }, [session]);

  const cashN = parseNum(cash);
  const cardN = parseNum(card);
  const otherN = parseNum(other);

  const countedTotal = Number(
    ((Number.isFinite(cashN) ? cashN : 0) +
      (Number.isFinite(cardN) ? cardN : 0) +
      (Number.isFinite(otherN) ? otherN : 0)).toFixed(2),
  );
  const expectedTotal = session?.expectedTotal ?? 0;
  const difference = Number((countedTotal - expectedTotal).toFixed(2));

  // ── Validation rules ──
  const countErrors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!cash.trim()) e.cash = 'Enter the cash counted (use 0 if none)';
    else if (!Number.isFinite(cashN)) e.cash = 'Must be a number';
    else if (cashN < 0) e.cash = 'Cannot be negative';

    if (!card.trim()) e.card = 'Enter card slips total (use 0 if none)';
    else if (!Number.isFinite(cardN)) e.card = 'Must be a number';
    else if (cardN < 0) e.card = 'Cannot be negative';

    if (!other.trim()) e.other = 'Enter other total (use 0 if none)';
    else if (!Number.isFinite(otherN)) e.other = 'Must be a number';
    else if (otherN < 0) e.other = 'Cannot be negative';

    return e;
  }, [cash, card, other, cashN, cardN, otherN]);

  const closeErrors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!signedOffBy.trim()) e.signedOffBy = 'Sign-off name is required';
    else if (signedOffBy.trim().length < 2) e.signedOffBy = 'Must be at least 2 characters';

    if (difference !== 0 && !explanation.trim()) {
      e.explanation = difference > 0
        ? 'Explain the overage before closing'
        : 'Explain the shortage before closing';
    } else if (difference !== 0 && explanation.trim().length < 10) {
      e.explanation = 'Give a bit more detail (at least 10 characters)';
    }

    return e;
  }, [signedOffBy, explanation, difference]);

  const countHasErrors = Object.keys(countErrors).length > 0;
  const closeHasErrors = Object.keys(closeErrors).length > 0;

  const recordCount = useMutation({
    mutationFn: () => auditApi.recordCount(id, {
      cashCounted: cashN,
      cardCounted: cardN,
      otherCounted: otherN,
      countedBy: signedOffBy.trim() || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['session', id] });
      qc.invalidateQueries({ queryKey: ['sessions'] });
      push('Count recorded', 'success');
      setSubmitAttempted(false);
      setTouched({});
    },
    onError: (e: unknown) => push(e instanceof Error ? e.message : 'Failed to record count', 'error'),
  });

  const close = useMutation({
    mutationFn: () => auditApi.closeSession(id, {
      countedTotal,
      signedOffBy: signedOffBy.trim(),
      explanation: explanation.trim() || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sessions'] });
      push('Session closed', 'success');
      navigate('/reconcile');
    },
    onError: (e: unknown) => push(e instanceof Error ? e.message : 'Failed to close session', 'error'),
  });

  if (isLoading) return <div className="skeleton skeleton-row" />;
  if (error || !session) return <div className="error-box">Session not found.</div>;

  const isCounted = session.status === 'counted';
  const isClosed = session.status === 'closed';
  const isOpen = session.status === 'open';

  const touch = (field: string) => setTouched((t) => ({ ...t, [field]: true }));
  const showCountError = (field: keyof typeof countErrors) =>
    (touched[field] || submitAttempted) && countErrors[field];
  const showCloseError = (field: keyof typeof closeErrors) =>
    (touched[field] || closeAttempted) && closeErrors[field];

  const submitCount = () => {
    setSubmitAttempted(true);
    if (countHasErrors) {
      push('Fix the highlighted fields before recording', 'error');
      return;
    }
    recordCount.mutate();
  };

  const submitClose = () => {
    setCloseAttempted(true);
    if (closeHasErrors) {
      push('Fix the highlighted fields before closing', 'error');
      return;
    }
    close.mutate();
  };

  const resetCount = () => {
    setCash('');
    setCard('');
    setOther('');
    setTouched({});
    setSubmitAttempted(false);
  };

  return (
    <>
      <div className="page-header">
        <div>
          <button className="btn-ghost btn-sm" onClick={() => navigate('/reconcile')} style={{ marginBottom: 8 }}>
            <ArrowLeft size={14} /> Back to reconcile queue
          </button>
          <h2>{session.registerCode} — {formatISODate(session.businessDate)}</h2>
          <p>{session.storeLocation} · Status: {session.status === 'open' ? 'Needs count' : session.status === 'counted' ? 'Awaiting sign-off' : 'Closed'}</p>
        </div>
      </div>

      {/* ── Count section ── */}
      {!isClosed && (
        <div className="reconciliation-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Enter physical count</h3>
              <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4, marginBottom: 0 }}>
                Count everything in the drawer — cash, card slips, gift vouchers. Enter 0 for anything that doesn't apply.
              </p>
            </div>
            {isCounted && (
              <button className="btn-ghost btn-sm" onClick={resetCount}>
                <X size={14} /> Recount
              </button>
            )}
          </div>

          <div className="reconciliation-grid">
            <CountInput
              icon={<Banknote size={14} />}
              label="Cash"
              value={cash}
              onChange={setCash}
              onBlur={() => touch('cash')}
              error={showCountError('cash') || null}
              disabled={isCounted}
            />
            <CountInput
              icon={<CreditCard size={14} />}
              label="Card slips"
              value={card}
              onChange={setCard}
              onBlur={() => touch('card')}
              error={showCountError('card') || null}
              disabled={isCounted}
            />
            <CountInput
              icon={<Coins size={14} />}
              label="Other"
              value={other}
              onChange={setOther}
              onBlur={() => touch('other')}
              error={showCountError('other') || null}
              disabled={isCounted}
            />
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
              <span>
                {difference === 0 ? 'Balanced' : difference > 0 ? 'Overage' : 'Shortage'}
              </span>
              <span
                className="value"
                style={{
                  color: difference === 0 ? 'var(--success)'
                    : difference > 0 ? 'var(--success)'
                    : 'var(--danger)',
                }}
              >
                {difference > 0 ? '+' : ''}{fmt(difference)}
              </span>
            </div>
          </div>

          {isOpen && (
            <button
              className="btn-primary btn-lg"
              onClick={submitCount}
              disabled={recordCount.isPending}
              style={{ marginTop: 16 }}
            >
              {recordCount.isPending ? 'Recording…' : 'Record count'}
            </button>
          )}
        </div>
      )}

      {/* ── Sign-off section ── */}
      {(isCounted || isClosed) && (
        <div className="card">
          <h3 style={{ marginBottom: 4, fontSize: 16, fontWeight: 700 }}>Manager sign-off</h3>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 0, marginBottom: 16 }}>
            {difference === 0
              ? 'Confirm the count and close the session.'
              : 'This session has a variance — explain what happened before closing.'}
          </p>

          <div className={`field ${showCloseError('signedOffBy') ? 'has-error' : ''}`}>
            <label>Signed off by <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input
              value={signedOffBy}
              onChange={(e) => setSignedOffBy(e.target.value)}
              onBlur={() => touch('signedOffBy')}
              placeholder="Your full name"
              disabled={isClosed}
              className={showCloseError('signedOffBy') ? 'input-error' : ''}
            />
            {showCloseError('signedOffBy') ? (
              <div className="field-error"><AlertTriangle size={12} /> {closeErrors.signedOffBy}</div>
            ) : (
              <p className="field-help">Recorded in the discrepancy log for accountability.</p>
            )}
          </div>

          {difference !== 0 && (
            <div className={`field ${showCloseError('explanation') ? 'has-error' : ''}`}>
              <label>
                Explanation <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <textarea
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                onBlur={() => touch('explanation')}
                placeholder={
                  difference > 0
                    ? 'e.g. Customer overpaid and we kept the change by mistake'
                    : 'e.g. Cashier forgot to log a KES 50 payout for cleaning supplies'
                }
                rows={3}
                disabled={isClosed}
                className={showCloseError('explanation') ? 'input-error' : ''}
              />
              {showCloseError('explanation') ? (
                <div className="field-error"><AlertTriangle size={12} /> {closeErrors.explanation}</div>
              ) : (
                <p className="field-help">
                  {explanation.length}/10 characters minimum · this will be stored permanently against the register session.
                </p>
              )}
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
              {difference > 0
                ? `Overage of ${fmt(difference)} must be explained.`
                : `Shortage of ${fmt(Math.abs(difference))} must be explained.`}
            </div>
          )}

          {!isClosed && (
            <button
              className="btn-success btn-lg"
              onClick={submitClose}
              disabled={close.isPending}
              style={{ marginTop: 16 }}
            >
              {close.isPending ? 'Closing…' : 'Sign off and close session'}
            </button>
          )}

          {isClosed && (
            <div style={{ marginTop: 16, color: 'var(--muted)', fontSize: 14 }}>
              Closed at {session.closedAt ? formatDateTime(session.closedAt) : '—'}
            </div>
          )}
        </div>
      )}
    </>
  );
}

function CountInput({
  icon,
  label,
  value,
  onChange,
  onBlur,
  error,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  error: string | null;
  disabled?: boolean;
}) {
  return (
    <div className={`field ${error ? 'has-error' : ''}`} style={{ marginBottom: 0 }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {icon} {label}
      </label>
      <input
        type="number"
        inputMode="decimal"
        min="0"
        step="0.01"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder="0.00"
        disabled={disabled}
        className={`reconciliation-input ${error ? 'input-error' : ''}`}
      />
      {error && (
        <div className="field-error"><AlertTriangle size={12} /> {error}</div>
      )}
    </div>
  );
}
