import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { procurementApi } from '../api/procurement';
import { StatusBadge } from '../components/StatusBadge';

export function ApprovalQueue() {
  const qc = useQueryClient();

  const { data: pos, isLoading } = useQuery({
    queryKey: ['purchase-orders', { status: 'pending' }],
    queryFn: () => procurementApi.listPOs({ status: 'pending' }),
  });

  const approve = useMutation({
    mutationFn: ({ id, approvedBy }: { id: string; approvedBy: string }) =>
      procurementApi.approvePO(id, approvedBy, 'Approved from queue'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
  });

  const approveOne = (id: string) => {
    const approvedBy = prompt('Approved by (your name):');
    if (!approvedBy) return;
    approve.mutate({ id, approvedBy });
  };

  return (
    <>
      <div className="page-header">
        <h2>Approval Queue</h2>
      </div>

      {approve.error && (
        <div className="error-box">{(approve.error as Error).message}</div>
      )}

      {isLoading && <div className="loading">Loading...</div>}

      {pos && pos.length === 0 && (
        <div className="empty">
          <p>Nothing to approve. 🎉</p>
        </div>
      )}

      {pos && pos.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>PO ID</th>
              <th>Supplier</th>
              <th>Total</th>
              <th>Expected</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {pos.map((po) => (
              <tr key={po.id}>
                <td>
                  <Link to={`/purchase-orders/${po.id}`}>
                    <code>{po.id.slice(0, 8)}</code>
                  </Link>
                </td>
                <td><strong>{po.supplierName}</strong></td>
                <td>{po.currency} {po.totalCost.toLocaleString()}</td>
                <td>{new Date(po.expectedDate).toLocaleDateString()}</td>
                <td><StatusBadge status={po.status} /></td>
                <td>
                  <button
                    className="btn-success"
                    style={{ padding: '4px 12px', fontSize: 12 }}
                    onClick={() => approveOne(po.id)}
                    disabled={approve.isPending}
                  >
                    Approve
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
