import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { inventoryApi } from '../api/inventory';
import { AvailabilityBadge } from '../components/StockBadge';

export function StockList() {
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [lowOnly, setLowOnly] = useState(false);

  const { data: items, isLoading, error } = useQuery({
    queryKey: ['stock', { search, location, lowOnly }],
    queryFn: () => inventoryApi.listStock({ productCode: search || undefined, locationCode: location || undefined, lowOnly: lowOnly || undefined }),
  });

  const { data: locations } = useQuery({ queryKey: ['locations'], queryFn: () => inventoryApi.listLocations() });

  const totalValue = items?.reduce((sum, item) => sum + item.valuation, 0) ?? 0;
  const totalUnits = items?.reduce((sum, item) => sum + item.onHand, 0) ?? 0;
  const lowCount = items?.filter((item) => item.available <= item.lowStockThreshold).length ?? 0;

  return (
    <>
      <div className="page-header">
        <h2>Stock</h2>
        <Link to="/adjust"><button className="btn-primary">Adjust Stock</button></Link>
      </div>

      {items && (
        <div className="summary">
          <div className="summary-item"><div className="num">{items.length}</div><div className="label">Stock Items</div></div>
          <div className="summary-item success"><div className="num">{totalUnits}</div><div className="label">Total Units</div></div>
          <div className="summary-item money"><div className="num">KES {Math.round(totalValue).toLocaleString()}</div><div className="label">Total Valuation</div></div>
          <div className={`summary-item ${lowCount > 0 ? 'danger' : 'success'}`}><div className="num">{lowCount}</div><div className="label">Low Stock</div></div>
        </div>
      )}

      <div className="filters">
        <input type="text" placeholder="Search by product code..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={location} onChange={(e) => setLocation(e.target.value)}>
          <option value="">All locations</option>
          {locations?.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, width: 'auto', margin: 0 }}>
          <input type="checkbox" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} style={{ width: 'auto' }} />
          <span>Low stock only</span>
        </label>
      </div>

      {isLoading && <div className="loading">Loading stock...</div>}
      {error && <div className="error-box">Failed to load stock</div>}
      {items && items.length === 0 && <div className="empty"><p>No stock items found.</p></div>}

      {items && items.length > 0 && (
        <table>
          <thead>
            <tr><th>Product</th><th>Location</th><th>On Hand</th><th>Allocated</th><th>Available</th><th>Unit Cost</th><th>Valuation</th><th>Status</th></tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  <Link to={`/stock/${encodeURIComponent(item.productCode)}/${encodeURIComponent(item.locationCode)}`}><strong>{item.productName}</strong></Link>
                  <br /><code style={{ fontSize: 11 }}>{item.productCode}</code>
                </td>
                <td>{item.locationCode}</td>
                <td className="num">{item.onHand}</td>
                <td className="num">{item.allocated}</td>
                <td className={`num ${item.available <= item.lowStockThreshold ? 'num-low' : 'num-good'}`}>{item.available}</td>
                <td className="num">{item.unitCost.toLocaleString()}</td>
                <td className="num">{item.valuation.toLocaleString()}</td>
                <td><AvailabilityBadge item={item} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
