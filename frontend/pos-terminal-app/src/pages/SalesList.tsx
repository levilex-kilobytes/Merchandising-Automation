import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Receipt, RotateCcw } from 'lucide-react';
import { retailApi } from '../api/retail';
import { Sale } from '../api/types';
import { useToast } from '../components/ToastProvider';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { formatDateTime, formatDate } from '../utils/format';

const fmt = (n: number) => `KES ${n.toFixed(2)}`;

export function SalesList() {
  const [status, setStatus] = useState('');
  const [voidTarget, setVoidTarget] = useState<string | null>(null);
  const [returnTarget, setReturnTarget] = useState<Sale | null>(null);
  const { push } = useToast();
  const qc = useQueryClient();

  const { data: sales, isLoading, error } = useQuery({
    queryKey: ['sales', { status }],
    queryFn: () => retailApi.listSales({ status: status || undefined }),
  });

  const voidSale = useMutation({
    mutationFn: (id: string) => retailApi.voidSale(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales'] });
      push('Sale voided', 'success');
    },
    onError: (e: unknown) => push(e instanceof Error ? e.message : 'Void failed', 'error'),
  });

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Sales</h2>
          <p>Every completed transaction at this store.</p>
        </div>
      </div>

      <div style={{ marginBottom: 20, maxWidth: 260 }}>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="completed">Completed</option>
          <option value="voided">Voided</option>
        </select>
      </div>

      {isLoading && <div className="skeleton skeleton-row" />}
      {error && <div className="error-box">Failed to load sales.</div>}

      {sales && sales.length === 0 && (
        <div className="empty">
          <div className="empty-icon"><Receipt size={30} /></div>
          <div className="empty-title">No sales yet</div>
          <div className="empty-hint">Complete a transaction from the Terminal to see it here.</div>
        </div>
      )}

      {sales && sales.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Sale #</th>
              <th>Store</th>
              <th>Total</th>
              <th>Status</th>
              <th>Time</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sales.map((s) => (
              <tr key={s.id}>
                <td><span className="cell-mono">{s.saleNumber}</span></td>
                <td>{s.storeLocation}</td>
                <td><span className="cell-mono">{fmt(s.grandTotal)}</span></td>
                <td><span className={`badge badge-${s.status}`}>{s.status}</span></td>
                <td>{formatDateTime(s.completedAt ?? s.createdAt)}</td>
                <td>
                  {s.status === 'completed' && (
                    <>
                      <button className="btn-ghost btn-sm" onClick={() => setReturnTarget(s)}>
                        <RotateCcw size={14} /> Return
                      </button>
                      <button className="btn-danger btn-sm" onClick={() => setVoidTarget(s.id)}>
                        Void
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {returnTarget && (
        <ReturnDialog
          sale={returnTarget}
          onClose={() => setReturnTarget(null)}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ['sales'] });
            qc.invalidateQueries({ queryKey: ['returns'] });
            push('Return processed', 'success');
            setReturnTarget(null);
          }}
        />
      )}

      <ConfirmDialog
        open={voidTarget !== null}
        variant="danger"
        title="Void this sale?"
        message="The sale will be marked voided and cannot be reversed from here."
        confirmLabel="Void"
        onCancel={() => setVoidTarget(null)}
        onConfirm={() => {
          if (voidTarget) voidSale.mutate(voidTarget);
          setVoidTarget(null);
        }}
      />
    </>
  );
}


function ReturnDialog({ sale, onClose, onSuccess }: { sale: Sale; onClose: () => void; onSuccess: () => void }) {
  const { push } = useToast();
  const { data: fullSale, isLoading } = useQuery({
    queryKey: ['sale', sale.id],
    queryFn: () => retailApi.getSale(sale.id),
  });
  const lines = fullSale?.lines ?? [];
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (lines.length) {
      setQuantities(Object.fromEntries(lines.map((l) => [l.productCode, 0])));
    }
  }, [fullSale]);

  const submit = useMutation({
    mutationFn: () => retailApi.createReturn({
      originalSaleId: sale.id,
      reason: reason.trim() || undefined,
      lines: Object.entries(quantities)
        .filter(([, qty]) => qty > 0)
        .map(([productCode, quantity]) => ({ productCode, quantity })),
    }),
    onSuccess,
    onError: (e: unknown) => push(e instanceof Error ? e.message : 'Return failed', 'error'),
  });

  const totalRefund = lines.reduce((s, l) => s + (quantities[l.productCode] ?? 0) * l.unitPrice, 0);
  const anySelected = Object.values(quantities).some((q) => q > 0);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ width: 'min(100%, 560px)' }}>
        <h3 className="modal-title">Return items</h3>
        <p className="modal-message">
          Sale <span className="mono">{sale.saleNumber}</span> · {sale.storeLocation}
        </p>

        {isLoading && <div className="skeleton skeleton-row" />}

        <div style={{ marginBottom: 16 }}>
          {lines.map((l) => {
            const max = l.quantity;
            const current = quantities[l.productCode] ?? 0;
            return (
              <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'var(--bg)', borderRadius: 8, marginBottom: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>{l.productName}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {l.productCode} · purchased {max} · KES {l.unitPrice.toFixed(2)} each
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    type="button"
                    className="btn-ghost btn-sm"
                    onClick={() => setQuantities((q) => ({ ...q, [l.productCode]: Math.max(0, current - 1) }))}
                    disabled={current <= 0}
                  >−</button>
                  <span className="mono" style={{ minWidth: 28, textAlign: 'center', fontWeight: 700 }}>{current}</span>
                  <button
                    type="button"
                    className="btn-ghost btn-sm"
                    onClick={() => setQuantities((q) => ({ ...q, [l.productCode]: Math.min(max, current + 1) }))}
                    disabled={current >= max}
                  >+</button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="field">
          <label>Reason (optional)</label>
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Wrong size, customer changed mind" />
        </div>

        <div style={{ padding: 12, background: 'var(--bg)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <strong>Refund total</strong>
          <strong className="mono">KES {totalRefund.toFixed(2)}</strong>
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={!anySelected || submit.isPending} onClick={() => submit.mutate()}>
            {submit.isPending ? 'Processing…' : `Process return`}
          </button>
        </div>
      </div>
    </div>
  );
}
