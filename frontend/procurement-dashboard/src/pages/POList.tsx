import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { procurementApi } from '../api/procurement';
import { StatusBadge } from '../components/StatusBadge';

export function POList() {
  const [status, setStatus] = useState('');

  const { data: pos, isLoading, error } = useQuery({
    queryKey: ['purchase-orders', { status }],
    queryFn: () => procurementApi.listPOs({ status: status || undefined }),
  });

  return (
    <>
      <div className="page-header">
        <h2>Purchase Orders</h2>
        <Link to="/purchase-orders/new">
          <button className="btn-primary">+ New Purchase Order</button>
        </Link>
      </div>

      <div className="filters">
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="pending">Pending approval</option>
          <option value="approved">Approved</option>
          <option value="sent">Sent to supplier</option>
          <option value="received">Received</option>
          <option value="closed">Closed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {isLoading && <div className="loading">Loading purchase orders...</div>}
      {error && <div className="error-box">Failed to load purchase orders</div>}

      {pos && pos.length === 0 && (
        <div className="empty">
          <p>No purchase orders found.</p>
          <Link to="/purchase-orders/new">
            <button className="btn-primary" style={{ marginTop: 16 }}>
              Create your first PO
            </button>
          </Link>
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
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
