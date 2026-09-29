import { useQuery } from '@tanstack/react-query';
import { RotateCcw } from 'lucide-react';
import { retailApi } from '../api/retail';

const fmt = (n: number) => `KES ${n.toFixed(2)}`;

export function ReturnsList() {
  const { data: returns, isLoading, error } = useQuery({
    queryKey: ['returns'],
    queryFn: () => retailApi.listReturns(),
  });

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Returns</h2>
          <p>Refunds processed against completed sales.</p>
        </div>
      </div>

      {isLoading && <div className="skeleton skeleton-row" />}
      {error && <div className="error-box">Failed to load returns.</div>}

      {returns && returns.length === 0 && (
        <div className="empty">
          <div className="empty-icon"><RotateCcw size={30} /></div>
          <div className="empty-title">No returns yet</div>
          <div className="empty-hint">Returns appear here when a customer refund is processed.</div>
        </div>
      )}

      {returns && returns.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Return #</th>
              <th>Store</th>
              <th>Refund</th>
              <th>Status</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {returns.map((r) => (
              <tr key={r.id}>
                <td><span className="cell-mono">{r.returnNumber}</span></td>
                <td>{r.storeLocation}</td>
                <td><span className="cell-mono">{fmt(r.refundTotal)}</span></td>
                <td><span className={`badge badge-${r.status}`}>{r.status}</span></td>
                <td>{new Date(r.completedAt ?? r.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
