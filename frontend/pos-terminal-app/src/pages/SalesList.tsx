import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Receipt } from 'lucide-react';
import { retailApi } from '../api/retail';
import { useToast } from '../components/ToastProvider';
import { ConfirmDialog } from '../components/ConfirmDialog';

const fmt = (n: number) => `KES ${n.toFixed(2)}`;

export function SalesList() {
  const [status, setStatus] = useState('');
  const [voidTarget, setVoidTarget] = useState<string | null>(null);
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
                <td>{new Date(s.completedAt ?? s.createdAt).toLocaleString()}</td>
                <td>
                  {s.status === 'completed' && (
                    <button className="btn-danger btn-sm" onClick={() => setVoidTarget(s.id)}>
                      Void
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
