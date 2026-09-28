import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { reorderApi } from '../api/procurement';
import { useToast } from '../components/Toast';

export function ReorderSuggestions() {
  const qc = useQueryClient();
  const toast = useToast();

  const { data: suggestions, isLoading, error } = useQuery({
    queryKey: ['reorder-suggestions'],
    queryFn: () => reorderApi.listPending(),
  });

  const dismiss = useMutation({
    mutationFn: (id: string) => reorderApi.dismiss(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reorder-suggestions'] });
      toast.success('Suggestion dismissed');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <>
      <div className="page-header">
        <h2>Reorder Suggestions</h2>
      </div>

      <p style={{ color: 'var(--muted)', marginBottom: 24 }}>
        Products where available stock has dropped below the reorder threshold.
        Created automatically when Inventory publishes a low-stock event.
      </p>

      {isLoading && <div className="loading">Loading suggestions...</div>}
      {error && <div className="error-box">Failed to load suggestions</div>}

      {suggestions && suggestions.length === 0 && (
        <div className="empty">
          <p>Nothing needs reordering right now. 🎉</p>
        </div>
      )}

      {suggestions && suggestions.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Location</th>
              <th>Available</th>
              <th>Threshold</th>
              <th>Suggested Qty</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {suggestions.map((s) => (
              <tr key={s.id}>
                <td><code>{s.productCode}</code></td>
                <td>{s.locationCode}</td>
                <td className="num num-low">{s.currentQty}</td>
                <td className="num">{s.threshold}</td>
                <td className="num num-good"><strong>{s.suggestedQty}</strong></td>
                <td>{new Date(s.createdAt).toLocaleString()}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Link to={`/purchase-orders/new?productCode=${encodeURIComponent(s.productCode)}&quantity=${s.suggestedQty}`}>
                      <button className="btn-primary" style={{ padding: '6px 14px', fontSize: 13 }}>
                        Create PO
                      </button>
                    </Link>
                    <button
                      className="btn-secondary"
                      style={{ padding: '6px 14px', fontSize: 13 }}
                      onClick={() => dismiss.mutate(s.id)}
                      disabled={dismiss.isPending}
                    >
                      Dismiss
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
