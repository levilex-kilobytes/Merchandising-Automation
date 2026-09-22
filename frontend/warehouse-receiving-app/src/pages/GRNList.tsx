import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { receivingApi } from '../api/receiving';
import { StatusBadge } from '../components/StatusBadge';

export function GRNList() {
  const [status, setStatus] = useState('');

  const { data: grns, isLoading, error } = useQuery({
    queryKey: ['grns', { status }],
    queryFn: () => receivingApi.listGRNs({ status: status || undefined }),
  });

  return (
    <>
      <div className="page-header">
        <h2>Goods Received Notes</h2>
        <Link to="/receive">
          <button className="btn-primary">+ Receive Delivery</button>
        </Link>
      </div>

      <div style={{ marginBottom: 20, maxWidth: 300 }}>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {isLoading && <div className="loading">Loading GRNs...</div>}
      {error && <div className="error-box">Failed to load GRNs</div>}

      {grns && grns.length === 0 && (
        <div className="empty">
          <p style={{ fontSize: 18, marginBottom: 20 }}>No GRNs yet.</p>
          <Link to="/receive">
            <button className="btn-primary">Receive a delivery</button>
          </Link>
        </div>
      )}

      {grns && grns.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>GRN</th>
              <th>PO</th>
              <th>Status</th>
              <th>Shortages</th>
              <th>Damages</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {grns.map((g) => (
              <tr key={g.id}>
                <td>
                  <Link to={`/grns/${g.id}`}>
                    <code>{g.id.slice(0, 8)}</code>
                  </Link>
                </td>
                <td><code>{g.poId.slice(0, 8)}</code></td>
                <td><StatusBadge status={g.status} /></td>
                <td>{g.shortages > 0 ? <strong style={{ color: 'var(--warning)' }}>{g.shortages}</strong> : '—'}</td>
                <td>{g.damages > 0 ? <strong style={{ color: 'var(--danger)' }}>{g.damages}</strong> : '—'}</td>
                <td>{new Date(g.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
