import { useQuery } from '@tanstack/react-query';
import { Tag } from 'lucide-react';
import { retailApi } from '../api/retail';

const fmt = (n: number) => `KES ${n.toFixed(2)}`;

export function PricesList() {
  const { data: prices, isLoading, error } = useQuery({
    queryKey: ['prices'],
    queryFn: () => retailApi.listPrices(),
  });

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Retail Prices</h2>
          <p>Active prices used at the point of sale.</p>
        </div>
      </div>

      {isLoading && <div className="skeleton skeleton-row" />}
      {error && <div className="error-box">Failed to load prices.</div>}

      {prices && prices.length === 0 && (
        <div className="empty">
          <div className="empty-icon"><Tag size={30} /></div>
          <div className="empty-title">No prices configured</div>
          <div className="empty-hint">Prices are seeded by the backend migrations.</div>
        </div>
      )}

      {prices && prices.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Unit Price</th>
            </tr>
          </thead>
          <tbody>
            {prices.map((p) => (
              <tr key={p.productCode}>
                <td>
                  <div className="cell-product">
                    <strong>{p.productName}</strong>
                  </div>
                </td>
                <td><span className="cell-mono">{p.productCode}</span></td>
                <td><span className="cell-mono">{fmt(p.unitPrice)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
