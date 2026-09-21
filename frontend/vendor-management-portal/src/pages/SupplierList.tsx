import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { vendorApi } from '../api/vendor';
import { StatusBadge } from '../components/StatusBadge';

export function SupplierList() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const { data: suppliers, isLoading, error } = useQuery({
    queryKey: ['suppliers', { search, status }],
    queryFn: () =>
      vendorApi.listSuppliers({
        search: search || undefined,
        status: status || undefined,
      }),
  });

  return (
    <>
      <div className="page-header">
        <h2>Suppliers</h2>
        <Link to="/suppliers/new">
          <button className="btn-primary">+ New Supplier</button>
        </Link>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="blacklisted">Blacklisted</option>
        </select>
      </div>

      {isLoading && <div className="loading">Loading suppliers...</div>}
      {error && <div className="error-box">Failed to load suppliers</div>}

      {suppliers && suppliers.length === 0 && (
        <div className="empty">
          <p>No suppliers found.</p>
          <Link to="/suppliers/new">
            <button className="btn-primary" style={{ marginTop: 16 }}>
              Create your first supplier
            </button>
          </Link>
        </div>
      )}

      {suppliers && suppliers.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Country</th>
              <th>Payment Terms</th>
              <th>Currency</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((s) => (
              <tr key={s.id}>
                <td>
                  <Link to={`/suppliers/${s.id}`}>
                    <strong>{s.name}</strong>
                  </Link>
                </td>
                <td>{s.email || '—'}</td>
                <td>{s.country}</td>
                <td>{s.paymentTerms}</td>
                <td>{s.defaultCurrency}</td>
                <td>
                  <StatusBadge status={s.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
