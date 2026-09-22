import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vendorApi } from '../api/vendor';
import { StatusBadge } from '../components/StatusBadge';

export function SupplierDetail() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

  const { data: supplier, isLoading } = useQuery({
    queryKey: ['supplier', id],
    queryFn: () => vendorApi.getSupplier(id!),
    enabled: !!id,
  });

  const { data: products } = useQuery({
    queryKey: ['supplier-products', id],
    queryFn: () => vendorApi.listProducts(id!),
    enabled: !!id,
  });

  const { data: priceHistory } = useQuery({
    queryKey: ['price-history', id, selectedProduct],
    queryFn: () => vendorApi.getPriceHistory(id!, selectedProduct!),
    enabled: !!id && !!selectedProduct,
  });

  const deactivate = useMutation({
    mutationFn: () => vendorApi.deactivateSupplier(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['supplier', id] });
      qc.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });

  if (isLoading || !supplier) return <div className="loading">Loading...</div>;

  return (
    <>
      <div className="page-header">
        <h2>
          <Link to="/" style={{ color: 'var(--muted)', fontSize: 14 }}>← Back</Link>
          <br />
          {supplier.name}
        </h2>
        {supplier.status === 'active' && (
          <button
            className="btn-danger"
            onClick={() => {
              if (confirm('Deactivate this supplier?')) deactivate.mutate();
            }}
            disabled={deactivate.isPending}
          >
            Deactivate
          </button>
        )}
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 16 }}>Profile</h3>
        <dl className="detail-grid">
          <dt>Status</dt><dd><StatusBadge status={supplier.status} /></dd>
          <dt>Legal name</dt><dd>{supplier.legalName || '—'}</dd>
          <dt>Tax ID</dt><dd>{supplier.taxId || '—'}</dd>
          <dt>Email</dt><dd>{supplier.email || '—'}</dd>
          <dt>Phone</dt><dd>{supplier.phone || '—'}</dd>
          <dt>Address</dt>
          <dd>
            {supplier.addressLine1 || '—'}
            {supplier.addressLine2 && <><br />{supplier.addressLine2}</>}
            {supplier.city && <><br />{supplier.city}</>}
            {supplier.country && <><br />{supplier.country}</>}
          </dd>
          <dt>Payment terms</dt><dd>{supplier.paymentTerms}</dd>
          <dt>Default currency</dt><dd>{supplier.defaultCurrency}</dd>
        </dl>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 16 }}>Product Catalog ({products?.length ?? 0})</h3>
        {products && products.length === 0 && (
          <div className="empty">No products in this supplier's catalog yet.</div>
        )}
        {products && products.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Product</th>
                <th>Unit Cost</th>
                <th>Currency</th>
                <th>Lead Time</th>
                <th>Min Order</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td><code>{p.productCode}</code></td>
                  <td>{p.productName}</td>
                  <td>{p.unitCost.toLocaleString()}</td>
                  <td>{p.currency}</td>
                  <td>{p.leadTimeDays} days</td>
                  <td>{p.minOrderQty}</td>
                  <td>
                    <button
                      className="btn-secondary"
                      style={{ padding: '4px 10px', fontSize: 12 }}
                      onClick={() => setSelectedProduct(p.productCode)}
                    >
                      Price history
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedProduct && (
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>
            Price history — <code>{selectedProduct}</code>
          </h3>
          {priceHistory && priceHistory.length === 0 && (
            <div className="empty">No price changes recorded.</div>
          )}
          {priceHistory && priceHistory.length > 0 && (
            <table>
              <thead>
                <tr>
                  <th>From</th>
                  <th>To</th>
                  <th>Currency</th>
                  <th>Effective</th>
                  <th>Changed At</th>
                </tr>
              </thead>
              <tbody>
                {priceHistory.map((h) => (
                  <tr key={h.id}>
                    <td>{h.oldCost !== null ? h.oldCost.toLocaleString() : '—'}</td>
                    <td><strong>{h.newCost.toLocaleString()}</strong></td>
                    <td>{h.currency}</td>
                    <td>{new Date(h.effectiveFrom).toLocaleDateString()}</td>
                    <td>{new Date(h.changedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </>
  );
}
