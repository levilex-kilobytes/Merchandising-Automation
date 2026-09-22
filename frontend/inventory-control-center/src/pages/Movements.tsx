import { useQuery } from '@tanstack/react-query';
import { inventoryApi } from '../api/inventory';
import { MovementBadge } from '../components/StockBadge';

export function Movements() {
  const { data: movements, isLoading } = useQuery({ queryKey: ['movements', 'all'], queryFn: () => inventoryApi.listMovements() });

  return (
    <>
      <div className="page-header"><h2>Stock Movements</h2></div>
      {isLoading && <div className="loading">Loading movements...</div>}
      {movements && movements.length === 0 && <div className="empty">No movements recorded yet.</div>}
      {movements && movements.length > 0 && (
        <table>
          <thead><tr><th>When</th><th>Type</th><th>Product</th><th>Location</th><th>Quantity</th><th>Reference</th></tr></thead>
          <tbody>
            {movements.map((m) => (
              <tr key={m.id}>
                <td>{new Date(m.createdAt).toLocaleString()}</td>
                <td><MovementBadge type={m.movementType} /></td>
                <td><code>{m.productCode}</code></td>
                <td>{m.locationCode}</td>
                <td className={`num ${m.quantity > 0 ? 'num-good' : 'num-low'}`}>{m.quantity > 0 ? '+' : ''}{m.quantity}</td>
                <td>{m.referenceId ? <code style={{ fontSize: 11 }}>{m.referenceId.slice(0, 8)}</code> : m.notes || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
