import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { receivingApi } from '../api/receiving';
import { StatusBadge, ConditionBadge } from '../components/StatusBadge';
import { GRNLine, ItemCondition } from '../api/types';

export function GRNDetail() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);

  const { data: grn, isLoading } = useQuery({
    queryKey: ['grn', id],
    queryFn: () => receivingApi.getGRN(id!),
    enabled: !!id,
  });

  const complete = useMutation({
    mutationFn: () => receivingApi.completeGRN(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['grn', id] });
      qc.invalidateQueries({ queryKey: ['grns'] });
    },
  });

  if (isLoading || !grn) return <div className="loading">Loading...</div>;

  return (
    <>
      <div className="page-header">
        <h2>
          <Link to="/" style={{ color: 'var(--muted)', fontSize: 16 }}>← Back</Link>
          <br />
          GRN <code>{grn.id.slice(0, 8)}</code>
        </h2>
        <StatusBadge status={grn.status} />
      </div>

      {complete.error && (
        <div className="error-box">{(complete.error as Error).message}</div>
      )}

      <div className="summary">
        <div className="summary-item">
          <div className="num">{grn.lines?.length ?? 0}</div>
          <div className="label">Line Items</div>
        </div>
        <div className={`summary-item ${grn.shortages > 0 ? 'warn' : 'success'}`}>
          <div className="num">{grn.shortages}</div>
          <div className="label">Shortages</div>
        </div>
        <div className={`summary-item ${grn.overages > 0 ? 'warn' : 'success'}`}>
          <div className="num">{grn.overages}</div>
          <div className="label">Overages</div>
        </div>
        <div className={`summary-item ${grn.damages > 0 ? 'danger' : 'success'}`}>
          <div className="num">{grn.damages}</div>
          <div className="label">Damages</div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 16 }}>Purchase Order</h3>
        <dl className="detail-grid">
          <dt>PO ID</dt><dd><code>{grn.poId}</code></dd>
          <dt>Supplier</dt><dd>{grn.supplierName}</dd>
          <dt>Created</dt><dd>{new Date(grn.createdAt).toLocaleString()}</dd>
          {grn.completedAt && <><dt>Completed</dt><dd>{new Date(grn.completedAt).toLocaleString()}</dd></>}
        </dl>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 16 }}>Line Items</h3>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Ordered</th>
              <th>Received</th>
              <th>Damaged</th>
              <th>Condition</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {grn.lines?.map((line) => (
              <tr key={line.id} className={line.condition === 'damaged' ? 'line-row-damaged' : ''}>
                <td>
                  <strong>{line.productName}</strong>
                  <br />
                  <code style={{ fontSize: 12 }}>{line.productCode}</code>
                </td>
                <td><strong>{line.orderedQty}</strong></td>
                <td><strong style={{ fontSize: 18 }}>{line.receivedQty}</strong></td>
                <td>{line.damagedQty > 0 ? <strong style={{ color: 'var(--danger)' }}>{line.damagedQty}</strong> : '—'}</td>
                <td><ConditionBadge condition={line.condition} /></td>
                <td>
                  {grn.status === 'draft' && (
                    <button
                      className="btn-secondary"
                      style={{ padding: '8px 16px', fontSize: 14, minHeight: 36 }}
                      onClick={() => setEditing(line.productCode)}
                    >
                      Record
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && grn.status === 'draft' && (
        <RecordLineModal
          grnId={id!}
          line={grn.lines?.find((l) => l.productCode === editing)!}
          onClose={() => setEditing(null)}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ['grn', id] });
            setEditing(null);
          }}
        />
      )}

      {grn.status === 'draft' && (
        <div className="card">
          <div className="actions">
            <button
              className="btn-success"
              onClick={() => {
                if (confirm('Complete this GRN? This will publish the receiving event and mark goods as received.')) {
                  complete.mutate();
                }
              }}
              disabled={complete.isPending}
            >
              {complete.isPending ? 'Completing...' : 'Complete GRN'}
            </button>
          </div>
        </div>
      )}

      {grn.status === 'completed' && (
        <div className="success-box">
          ✓ GRN completed. Goods received and event published.
        </div>
      )}
    </>
  );
}

function RecordLineModal({
  grnId,
  line,
  onClose,
  onSuccess,
}: {
  grnId: string;
  line: GRNLine;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [qty, setQty] = useState(line.receivedQty);
  const [damaged, setDamaged] = useState(line.damagedQty);
  const [condition, setCondition] = useState<ItemCondition>(line.condition);
  const [notes, setNotes] = useState(line.notes || '');

  const save = useMutation({
    mutationFn: () =>
      receivingApi.recordLine(grnId, {
        productCode: line.productCode,
        receivedQty: qty,
        damagedQty: damaged,
        condition,
        notes: notes || undefined,
      }),
    onSuccess,
  });

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{ maxWidth: 600, width: '100%', margin: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginBottom: 4 }}>Record Receipt</h3>
        <p style={{ color: 'var(--muted)', marginBottom: 24 }}>
          {line.productName} <code>{line.productCode}</code>
        </p>

        {save.error && <div className="error-box">{(save.error as Error).message}</div>}

        <div className="field">
          <label>Ordered Quantity</label>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{line.orderedQty}</div>
        </div>

        <div className="field">
          <label>Received Quantity</label>
          <div className="qty-controls">
            <button
              type="button"
              className="qty-btn"
              onClick={() => setQty(Math.max(0, qty - 1))}
            >
              −
            </button>
            <input
              type="number"
              min={0}
              value={qty}
              onChange={(e) => setQty(parseInt(e.target.value) || 0)}
              className="qty-input"
            />
            <button
              type="button"
              className="qty-btn"
              onClick={() => setQty(qty + 1)}
            >
              +
            </button>
          </div>
        </div>

        <div className="field">
          <label>Condition</label>
          <select value={condition} onChange={(e) => setCondition(e.target.value as ItemCondition)}>
            <option value="good">Good</option>
            <option value="damaged">Damaged</option>
          </select>
        </div>

        {condition === 'damaged' && (
          <div className="field">
            <label>Damaged Quantity</label>
            <input
              type="number"
              min={0}
              value={damaged}
              onChange={(e) => setDamaged(parseInt(e.target.value) || 0)}
            />
          </div>
        )}

        <div className="field">
          <label>Notes (optional)</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., 5 units missing from shipment"
          />
        </div>

        <div className="actions" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => save.mutate()}
            disabled={save.isPending}
          >
            {save.isPending ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
