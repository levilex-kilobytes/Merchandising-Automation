import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Receipt, AlertTriangle, X, CreditCard, Clock } from 'lucide-react';
import { financeApi } from '../api/finance';
import { SupplierBill } from '../api/types';
import { useToast } from '../components/ToastProvider';
import { StatCard } from '../components/StatCard';
import { formatISODate } from '../utils/format';

const fullMoney = (n: number) => `KES ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const shortMoney = (n: number) => `KES ${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

export function Payables() {
  const [statusFilter, setStatusFilter] = useState('');
  const [payTarget, setPayTarget] = useState<SupplierBill | null>(null);
  const { push } = useToast();
  const qc = useQueryClient();

  const { data: bills, isLoading, error } = useQuery({
    queryKey: ['bills', statusFilter],
    queryFn: () => financeApi.listBills(statusFilter ? { status: statusFilter } : undefined),
  });

  const { data: aging } = useQuery({
    queryKey: ['ap-aging'],
    queryFn: () => financeApi.apAging(),
  });

  const stats = useMemo(() => {
    if (!bills) return { total: 0, outstanding: 0, overdue: 0 };
    const open = bills.filter((b) => b.status !== 'paid');
    return {
      total: open.length,
      outstanding: open.reduce((s, b) => s + b.outstanding, 0),
      overdue: open.filter((b) => new Date(b.dueDate) < new Date()).length,
    };
  }, [bills]);

  const agingTotal = (aging ?? []).reduce((s, b) => s + b.total, 0);
  const agingColors = ['#16a34a', '#0284c7', '#ea580c', '#dc2626', '#7c2d12'];

  const today = new Date().toISOString().slice(0, 10);
  const isOverdue = (b: SupplierBill) => b.status !== 'paid' && b.dueDate < today;

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Accounts Payable</h2>
          <p>What the business owes suppliers and when it's due.</p>
        </div>
      </div>

      <div className="summary">
        <StatCard icon={<Receipt size={22} />} label="Open Bills" value={stats.total} tone="warning" />
        <StatCard icon={<CreditCard size={22} />} label="Total Outstanding" value={shortMoney(stats.outstanding)} tone="primary" />
        <StatCard icon={<AlertTriangle size={22} />} label="Overdue" value={stats.overdue} tone={stats.overdue > 0 ? 'danger' : 'success'} />
      </div>

      {aging && aging.length > 0 && agingTotal > 0 && (
        <div className="card">
          <div className="chart-header">
            <h3>AP Aging</h3>
            <p>Outstanding payables grouped by how far past due they are</p>
          </div>

          <div className="aging-bar">
            {aging.map((b, i) => {
              const pct = agingTotal === 0 ? 0 : (b.total / agingTotal) * 100;
              if (pct === 0) return null;
              return (
                <div
                  key={b.bucket}
                  className="aging-segment"
                  style={{ width: `${pct}%`, background: agingColors[i] }}
                  title={`${b.bucket}: ${shortMoney(b.total)}`}
                >
                  {pct > 8 ? `${pct.toFixed(0)}%` : ''}
                </div>
              );
            })}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            {aging.map((b, i) => (
              <div key={b.bucket} className="aging-bucket" style={{ borderLeft: `4px solid ${agingColors[i]}` }}>
                <div className="aging-bucket-label">{b.bucket}</div>
                <div className="aging-bucket-value">{shortMoney(b.total)}</div>
                <div className="aging-bucket-count">{b.count} bill{b.count === 1 ? '' : 's'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="filters">
        {[
          { v: '', l: 'All' },
          { v: 'open', l: 'Open' },
          { v: 'partial', l: 'Partial' },
          { v: 'paid', l: 'Paid' },
        ].map(({ v, l }) => (
          <button
            key={v || 'all'}
            className={`btn-${statusFilter === v ? 'primary' : 'ghost'} btn-sm`}
            onClick={() => setStatusFilter(v)}
          >
            {l}
          </button>
        ))}
      </div>

      {isLoading && <div className="skeleton skeleton-row" />}
      {error && <div className="error-box">Failed to load bills: {error instanceof Error ? error.message : 'unknown'}</div>}

      {!isLoading && (bills ?? []).length === 0 && (
        <div className="empty">
          <div className="empty-icon"><Receipt size={30} /></div>
          <div className="empty-title">No supplier bills</div>
          <div className="empty-hint">
            Bills are created automatically when Goods Received Notes are completed in Receiving.
          </div>
        </div>
      )}

      {(bills ?? []).length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Bill #</th>
              <th>Supplier</th>
              <th className="num">Amount</th>
              <th className="num">Paid</th>
              <th className="num">Outstanding</th>
              <th>Due Date</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {bills!.map((b) => {
              const overdue = isOverdue(b);
              return (
                <tr key={b.id}>
                  <td><span className="mono" style={{ fontWeight: 700 }}>{b.billNumber}</span></td>
                  <td>{b.supplierName}</td>
                  <td className="num">{fullMoney(b.amount)}</td>
                  <td className="num">{fullMoney(b.paidAmount)}</td>
                  <td className="num"><strong>{fullMoney(b.outstanding)}</strong></td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: overdue ? 'var(--danger)' : 'inherit', fontWeight: overdue ? 700 : 500 }}>
                      <Clock size={12} /> {formatISODate(b.dueDate)}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${overdue && b.status !== 'paid' ? 'overdue' : b.status}`}>
                      {overdue && b.status !== 'paid' ? 'overdue' : b.status}
                    </span>
                  </td>
                  <td>
                    {b.status !== 'paid' && (
                      <button className="btn-primary btn-sm" onClick={() => setPayTarget(b)}>
                        Pay
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {payTarget && (
        <PayModal
          bill={payTarget}
          onClose={() => setPayTarget(null)}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ['bills'] });
            qc.invalidateQueries({ queryKey: ['ap-aging'] });
            qc.invalidateQueries({ queryKey: ['pnl'] });
            qc.invalidateQueries({ queryKey: ['bs'] });
            push('Payment recorded', 'success');
            setPayTarget(null);
          }}
        />
      )}
    </>
  );
}

function PayModal({ bill, onClose, onSuccess }: { bill: SupplierBill; onClose: () => void; onSuccess: () => void }) {
  const { push } = useToast();
  const [amount, setAmount] = useState(String(bill.outstanding));
  const amountN = Number(amount);
  const [error, setError] = useState<string | null>(null);

  const pay = useMutation({
    mutationFn: () => financeApi.payBill(bill.id, amountN),
    onSuccess,
    onError: (e: unknown) => push(e instanceof Error ? e.message : 'Payment failed', 'error'),
  });

  const submit = () => {
    setError(null);
    if (!amount.trim()) return setError('Enter an amount');
    if (!Number.isFinite(amountN)) return setError('Must be a number');
    if (amountN <= 0) return setError('Must be greater than zero');
    if (amountN > bill.outstanding + 0.01) return setError(`Cannot exceed outstanding (${fullMoney(bill.outstanding)})`);
    pay.mutate();
  };

  const isPartial = Math.abs(amountN - bill.outstanding) > 0.01;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h3 className="modal-title">Record payment</h3>
          <button className="btn-ghost btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <p className="modal-message">
          Bill <span className="mono">{bill.billNumber}</span> · {bill.supplierName}
        </p>

        <div style={{ padding: 12, background: 'var(--bg)', borderRadius: 8, marginBottom: 16, display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
          <span style={{ color: 'var(--muted)' }}>Outstanding</span>
          <span className="mono" style={{ fontWeight: 700 }}>{fullMoney(bill.outstanding)}</span>
        </div>

        <div className={`field ${error ? 'has-error' : ''}`}>
          <label>Amount to pay <span style={{ color: 'var(--danger)' }}>*</span></label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={amount}
            onChange={(e) => { setAmount(e.target.value); setError(null); }}
            className={`mono ${error ? 'input-error' : ''}`}
            style={{ fontSize: 20, textAlign: 'center', fontWeight: 700 }}
            autoFocus
          />
          {error ? (
            <div className="field-error"><AlertTriangle size={12} /> {error}</div>
          ) : (
            <p className="field-help">
              {isPartial
                ? 'Partial payment — the bill will remain open for the balance.'
                : 'Full payment — the bill will be marked paid.'}
            </p>
          )}
        </div>

        <div style={{ padding: 12, background: 'var(--bg)', borderRadius: 8, fontSize: 13, color: 'var(--muted)' }}>
          <strong style={{ color: 'var(--text)' }}>Ledger impact:</strong> debit Accounts Payable, credit Cash. This posts a journal entry automatically.
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={pay.isPending} onClick={submit}>
            {pay.isPending ? 'Recording…' : `Pay ${fullMoney(amountN || 0)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
