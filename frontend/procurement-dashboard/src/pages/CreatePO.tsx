import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { procurementApi, vendorApi } from '../api/procurement';

interface LineForm {
  productCode: string;
  quantity: number;
}

export function CreatePO() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [supplierId, setSupplierId] = useState('');
  const [currency, setCurrency] = useState('KES');
  const [expectedDate, setExpectedDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  );
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<LineForm[]>([{ productCode: '', quantity: 1 }]);

  const { data: suppliers } = useQuery({
    queryKey: ['vendor-suppliers'],
    queryFn: () => vendorApi.listSuppliers({ status: 'active' }),
  });

  const { data: products } = useQuery({
    queryKey: ['vendor-products', supplierId],
    queryFn: () => vendorApi.listProducts(supplierId),
    enabled: !!supplierId,
  });

  const create = useMutation({
    mutationFn: () =>
      procurementApi.createPO({
        supplierId,
        currency,
        expectedDate,
        notes: notes || undefined,
        lines: lines
          .filter((l) => l.productCode && l.quantity > 0)
          .map((l) => ({ productCode: l.productCode, quantity: l.quantity })),
      }),
    onSuccess: (po) => {
      qc.invalidateQueries({ queryKey: ['purchase-orders'] });
      navigate(`/purchase-orders/${po.id}`);
    },
  });

  const updateLine = (idx: number, patch: Partial<LineForm>) => {
    setLines((prev) =>
      prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)),
    );
  };

  const addLine = () =>
    setLines((prev) => [...prev, { productCode: '', quantity: 1 }]);

  const removeLine = (idx: number) =>
    setLines((prev) => prev.filter((_, i) => i !== idx));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    create.mutate();
  };

  return (
    <>
      <div className="page-header">
        <h2>New Purchase Order</h2>
      </div>

      {create.error && (
        <div className="error-box">{(create.error as Error).message}</div>
      )}

      <form className="card" onSubmit={submit}>
        <div className="field">
          <label>Supplier *</label>
          <select
            required
            value={supplierId}
            onChange={(e) => {
              setSupplierId(e.target.value);
              setLines([{ productCode: '', quantity: 1 }]);
            }}
          >
            <option value="">— Select a supplier —</option>
            {suppliers?.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="row">
          <div className="field">
            <label>Currency *</label>
            <input
              required
              maxLength={3}
              minLength={3}
              value={currency}
              onChange={(e) => setCurrency(e.target.value.toUpperCase())}
            />
          </div>
          <div className="field">
            <label>Expected Date *</label>
            <input
              required
              type="date"
              value={expectedDate}
              onChange={(e) => setExpectedDate(e.target.value)}
            />
          </div>
        </div>

        <div className="field">
          <label>Notes</label>
          <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <h3 style={{ marginTop: 24, marginBottom: 12 }}>Line Items</h3>

        {lines.map((line, idx) => (
          <div key={idx} className="row" style={{ alignItems: 'end' }}>
            <div className="field">
              <label>Product {idx + 1}</label>
              <select
                required
                value={line.productCode}
                disabled={!supplierId}
                onChange={(e) => updateLine(idx, { productCode: e.target.value })}
              >
                <option value="">— Select a product —</option>
                {products?.map((p) => (
                  <option key={p.id} value={p.productCode}>
                    {p.productName} ({p.productCode}) — {p.currency} {p.unitCost}
                  </option>
                ))}
              </select>
            </div>
            <div className="field" style={{ display: 'flex', gap: 8 }}>
              <input
                required
                type="number"
                min={1}
                value={line.quantity}
                onChange={(e) => updateLine(idx, { quantity: parseInt(e.target.value) || 1 })}
                style={{ flex: 1 }}
              />
              {lines.length > 1 && (
                <button
                  type="button"
                  className="btn-danger"
                  onClick={() => removeLine(idx)}
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        ))}

        <button type="button" className="btn-secondary" onClick={addLine}>
          + Add another line
        </button>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
          <button type="button" className="btn-secondary" onClick={() => navigate('/')}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={create.isPending || !supplierId}>
            {create.isPending ? 'Creating...' : 'Create Purchase Order'}
          </button>
        </div>
      </form>
    </>
  );
}
