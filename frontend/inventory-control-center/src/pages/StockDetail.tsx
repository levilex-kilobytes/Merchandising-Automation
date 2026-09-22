import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { inventoryApi } from '../api/inventory';
import { AvailabilityBadge, MovementBadge } from '../components/StockBadge';

export function StockDetail() {
  const { productCode, locationCode } = useParams<{
    productCode: string;
    locationCode: string;
  }>();

  const { data: item, isLoading } = useQuery({
    queryKey: ['stock-item', productCode, locationCode],
    queryFn: () => inventoryApi.getStockItem(productCode!, locationCode!),
    enabled: !!productCode && !!locationCode,
  });

  const { data: movements } = useQuery({
    queryKey: ['movements', productCode, locationCode],
    queryFn: () => inventoryApi.listMovements({ productCode, locationCode }),
    enabled: !!productCode && !!locationCode,
  });

  if (isLoading || !item) return <div className="loading">Loading...</div>;

  return (
    <>
      <div className="page-header">
        <h2>
          <Link to="/" style={{ color: 'var(--muted)', fontSize: 14 }}>← Back</Link>
          <br />
          {item.productName}
        </h2>
        <AvailabilityBadge item={item} />
      </div>

      <div className="summary">
        <div className="summary-item">
          <div className="num">{item.onHand}</div>
          <div className="label">On Hand</div>
        </div>
        <div className="summary-item">
          <div className="num">{item.allocated}</div>
          <div className="label">Allocated</div>
        </div>
        <div className={`summary-item ${item.available <= item.lowStockThreshold ? 'danger' : 'success'}`}>
          <div className="num">{item.available}</div>
          <div className="label">Available</div>
        </div>
        <div className="summary-item">
          <div className="num">{item.onOrder}</div>
          <div className="label">On Order</div>
        </div>
        <div className="summary-item money">
          <div className="num">KES {item.valuation.toLocaleString()}</div>
          <div className="label">Valuation</div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 16 }}>Details</h3>
        <dl className="detail-grid">
          <dt>Product code</dt><dd><code>{item.productCode}</code></dd>
          <dt>Location</dt><dd>{item.locationCode}</dd>
          <dt>Unit cost</dt><dd>{item.unitCost.toLocaleString()}</dd>
          <dt>Low stock threshold</dt><dd>{item.lowStockThreshold}</dd>
          <dt>Last updated</dt><dd>{new Date(item.updatedAt).toLocaleString()}</dd>
        </dl>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 16 }}>Movement History</h3>
        {movements && movements.length === 0 && (
          <div className="empty">No movements recorded yet.</div>
        )}
        {movements && movements.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Quantity</th>
                <th>Reference</th>
                <th>Notes</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id}>
                  <td><MovementBadge type={m.movementType} /></td>
                  <td className={`num ${m.quantity > 0 ? 'num-good' : 'num-low'}`}>
                    {m.quantity > 0 ? '+' : ''}{m.quantity}
                  </td>
                  <td>
                    {m.referenceId ? (
                      <>
                        <code style={{ fontSize: 11 }}>{m.referenceId.slice(0, 8)}</code>
                        <br />
                        <span style={{ color: 'var(--muted)', fontSize: 11 }}>{m.referenceType}</span>
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>{m.notes || '—'}</td>
                  <td>{new Date(m.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
