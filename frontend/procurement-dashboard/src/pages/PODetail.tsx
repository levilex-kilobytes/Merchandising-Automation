import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { procurementApi } from '../api/procurement';
import { StatusBadge } from '../components/StatusBadge';

export function PODetail() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();

  const { data: po, isLoading } = useQuery({
    queryKey: ['purchase-order', id],
    queryFn: () => procurementApi.getPO(id!),
    enabled: !!id,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['purchase-order', id] });
    qc.invalidateQueries({ queryKey: ['purchase-orders'] });
  };

  const submit = useMutation({
    mutationFn: () => procurementApi.submitPO(id!),
    onSuccess: invalidate,
  });

  const approve = useMutation({
    mutationFn: () => {
      const approvedBy = prompt('Approved by (your name):');
      if (!approvedBy) throw new Error('Cancelled');
      return procurementApi.approvePO(id!, approvedBy, 'Approved via dashboard');
    },
    onSuccess: invalidate,
  });

  const send = useMutation({
    mutationFn: () => procurementApi.sendPO(id!),
    onSuccess: invalidate,
  });

  const close = useMutation({
    mutationFn: () => procurementApi.closePO(id!),
    onSuccess: invalidate,
  });

  const cancel = useMutation({
    mutationFn: () => {
      const reason = prompt('Cancellation reason:');
      if (!reason) throw new Error('Cancelled');
      return procurementApi.cancelPO(id!, reason);
    },
    onSuccess: invalidate,
  });

  if (isLoading || !po) return <div className="loading">Loading...</div>;

  const copyId = () => {
    navigator.clipboard.writeText(po.id);
    alert('PO ID copied to clipboard:\n' + po.id);
  };

  return (
    <>
      <div className="page-header">
        <h2>
          <Link to="/" style={{ color: 'var(--muted)', fontSize: 14 }}>← Back</Link>
          <br />
          Purchase Order
        </h2>
        <StatusBadge status={po.status} />
      </div>

      {(submit.error || approve.error || send.error || close.error || cancel.error) && (
        <div className="error-box">
          {(submit.error || approve.error || send.error || close.error || cancel.error)?.message}
        </div>
      )}

      <div className="card">
        <h3 style={{ marginBottom: 12 }}>PO ID</h3>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <code style={{ fontSize: 16, padding: '8px 12px', userSelect: 'all' }}>
            {po.id}
          </code>
          <button
            className="btn-secondary"
            style={{ padding: '8px 16px', fontSize: 14 }}
            onClick={copyId}
          >
            Copy ID
          </button>
        </div>
        <p style={{ color: 'var(--muted)', marginTop: 12, fontSize: 13 }}>
          Use this full UUID when receiving the goods in the Warehouse Receiving App.
        </p>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 16 }}>Actions</h3>
        <div className="actions">
          {po.status === 'draft' && (
            <button className="btn-primary" onClick={() => submit.mutate()} disabled={submit.isPending}>
              Submit for approval
            </button>
          )}
          {po.status === 'pending' && (
            <button className="btn-success" onClick={() => approve.mutate()} disabled={approve.isPending}>
              Approve
            </button>
          )}
          {po.status === 'approved' && (
            <button className="btn-primary" onClick={() => send.mutate()} disabled={send.isPending}>
              Send to supplier
            </button>
          )}
          {(po.status === 'sent' || po.status === 'received') && (
            <button className="btn-secondary" onClick={() => close.mutate()} disabled={close.isPending}>
              Close PO
            </button>
          )}
          {po.status !== 'closed' && po.status !== 'cancelled' && (
            <button className="btn-danger" onClick={() => cancel.mutate()} disabled={cancel.isPending}>
              Cancel
            </button>
          )}
          {po.status === 'closed' && (
            <p style={{ color: 'var(--muted)' }}>This PO is closed. No further actions.</p>
          )}
          {po.status === 'cancelled' && (
            <p style={{ color: 'var(--muted)' }}>This PO was cancelled.</p>
          )}
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 16 }}>Details</h3>
        <dl className="detail-grid">
          <dt>Supplier</dt><dd><strong>{po.supplierName}</strong></dd>
          <dt>Total cost</dt><dd>{po.currency} {po.totalCost.toLocaleString()}</dd>
          <dt>Expected date</dt><dd>{new Date(po.expectedDate).toLocaleDateString()}</dd>
          {po.notes && <><dt>Notes</dt><dd>{po.notes}</dd></>}
          <dt>Created</dt><dd>{new Date(po.createdAt).toLocaleString()}</dd>
        </dl>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 16 }}>Line items ({po.lines?.length ?? 0})</h3>
        {po.lines && po.lines.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Product</th>
                <th>Ordered</th>
                <th>Received</th>
                <th>Unit cost</th>
                <th>Line total</th>
                <th>Lead time</th>
              </tr>
            </thead>
            <tbody>
              {po.lines.map((line) => (
                <tr key={line.id}>
                  <td><code>{line.productCode}</code></td>
                  <td>{line.productName}</td>
                  <td>{line.orderedQty}</td>
                  <td>{line.receivedQty}</td>
                  <td>{line.unitCost.toLocaleString()}</td>
                  <td><strong>{line.lineTotal.toLocaleString()}</strong></td>
                  <td>{line.leadTimeDays} days</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 16 }}>Timeline</h3>
        <ul className="timeline">
          <li>
            <div className="ts">{new Date(po.createdAt).toLocaleString()}</div>
            <div>Created (draft)</div>
          </li>
          {po.approvedAt && (
            <li>
              <div className="ts">{new Date(po.approvedAt).toLocaleString()}</div>
              <div>Approved by <strong>{po.approvedBy}</strong></div>
            </li>
          )}
          {po.sentAt && (
            <li>
              <div className="ts">{new Date(po.sentAt).toLocaleString()}</div>
              <div>Sent to supplier</div>
            </li>
          )}
          {po.closedAt && (
            <li>
              <div className="ts">{new Date(po.closedAt).toLocaleString()}</div>
              <div>Closed</div>
            </li>
          )}
          {po.cancelledAt && (
            <li>
              <div className="ts">{new Date(po.cancelledAt).toLocaleString()}</div>
              <div>Cancelled — {po.cancellationReason}</div>
            </li>
          )}
        </ul>
      </div>
    </>
  );
}
