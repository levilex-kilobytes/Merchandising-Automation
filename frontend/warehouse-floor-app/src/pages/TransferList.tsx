import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowRight, Truck, Send, PackageCheck, AlertTriangle, Plus } from 'lucide-react';
import { warehouseApi } from '../api/warehouse';
import { StatusBadge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import { TableSkeleton } from '../components/Skeleton';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../components/ToastProvider';
import { formatDateTime } from '../utils/format';

export function TransferList() {
  const [status, setStatus] = useState('');
  const [confirmAction, setConfirmAction] = useState<{ id: string; kind: 'dispatch' | 'receive' } | null>(null);
  const qc = useQueryClient();
  const { push } = useToast();

  const { data: transfers, isLoading, error } = useQuery({
    queryKey: ['transfers', { status }],
    queryFn: () => warehouseApi.listTransfers(status || undefined),
  });

  const dispatch = useMutation({
    mutationFn: (id: string) => warehouseApi.dispatchTransfer(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transfers'] });
      push('Transfer dispatched', 'success');
    },
    onError: (e: unknown) => push(e instanceof Error ? e.message : 'Failed', 'error'),
  });

  const receive = useMutation({
    mutationFn: (id: string) => warehouseApi.receiveTransfer(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transfers'] });
      push('Transfer received', 'success');
    },
    onError: (e: unknown) => push(e instanceof Error ? e.message : 'Failed', 'error'),
  });

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Stock Transfers</h2>
          <p>Move stock between warehouse and store locations.</p>
        </div>
        <Link to="/transfers/new" className="btn-primary">
          <Plus size={16} /> New Transfer
        </Link>
      </div>

      <div className="filters">
        {[
          { value: '', label: 'All' },
          { value: 'draft', label: 'Draft' },
          { value: 'dispatched', label: 'Dispatched' },
          { value: 'received', label: 'Received' },
        ].map((s) => (
          <button
            key={s.value || 'all'}
            className={`chip ${status === s.value ? 'active' : ''}`}
            onClick={() => setStatus(s.value)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {isLoading && <TableSkeleton rows={4} />}
      {error && <div className="error-box">Failed to load transfers.</div>}

      {transfers && transfers.length === 0 && (
        <EmptyState
          icon={<Truck size={30} />}
          title="No transfers"
          hint="Transfers appear here once stock is scheduled to move between locations."
        />
      )}

      {transfers && transfers.length > 0 && (
        <table className="responsive-table">
          <thead>
            <tr>
              <th>From</th>
              <th>To</th>
              <th>Status</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {transfers.map((t) => (
              <tr key={t.id}>
                <td data-label="From"><code>{t.fromLocation}</code></td>
                <td data-label="To">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <ArrowRight size={14} style={{ color: 'var(--muted)' }} />
                    <code>{t.toLocation}</code>
                  </span>
                </td>
                <td data-label="Status"><StatusBadge status={t.status} /></td>
                <td data-label="Created">{formatDateTime(t.createdAt)}</td>
                <td data-label="">
                  {t.status === 'draft' && (
                    <button className="btn-primary btn-sm" onClick={() => setConfirmAction({ id: t.id, kind: 'dispatch' })}>
                      <Send size={14} /> Dispatch
                    </button>
                  )}
                  {t.status === 'dispatched' && (
                    <button className="btn-success btn-sm" onClick={() => setConfirmAction({ id: t.id, kind: 'receive' })}>
                      <PackageCheck size={14} /> Receive
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <ConfirmDialog
        open={confirmAction !== null}
        variant={confirmAction?.kind === 'receive' ? 'success' : 'primary'}
        title={confirmAction?.kind === 'dispatch' ? 'Dispatch this transfer?' : 'Receive this transfer?'}
        message={
          confirmAction?.kind === 'dispatch'
            ? 'Stock will be marked as in-transit and can no longer be edited.'
            : 'Stock will be marked as received at the destination location.'
        }
        confirmLabel={confirmAction?.kind === 'dispatch' ? 'Dispatch' : 'Receive'}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => {
          if (!confirmAction) return;
          if (confirmAction.kind === 'dispatch') dispatch.mutate(confirmAction.id);
          else receive.mutate(confirmAction.id);
          setConfirmAction(null);
        }}
      >
        <div style={{ display: 'flex', gap: 8, padding: '12px 0', justifyContent: 'center', color: 'var(--muted)', fontSize: 13 }}>
          <AlertTriangle size={16} /> This action cannot be undone.
        </div>
      </ConfirmDialog>
    </>
  );
}
