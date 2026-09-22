import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { inventoryApi } from '../api/inventory';

export function AdjustStock() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    productCode: '',
    locationCode: 'MAIN',
    delta: 0,
    reason: '',
  });

  const adjust = useMutation({
    mutationFn: () => inventoryApi.adjustStock(form),
    onSuccess: (item) => {
      navigate(`/stock/${encodeURIComponent(item.productCode)}/${encodeURIComponent(item.locationCode)}`);
    },
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    adjust.mutate();
  };

  const update = (key: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <>
      <div className="page-header">
        <h2>Adjust Stock</h2>
      </div>

      {adjust.error && (
        <div className="error-box">{(adjust.error as Error).message}</div>
      )}

      <form className="card" onSubmit={submit}>
        <p style={{ color: 'var(--muted)', marginBottom: 24 }}>
          Use this for cycle-count corrections, shrinkage write-offs, or damage adjustments.
          Every adjustment is logged with the reason you provide.
        </p>

        <div className="row">
          <div className="field">
            <label>Product Code *</label>
            <input
              required
              value={form.productCode}
              onChange={(e) => update('productCode', e.target.value)}
              placeholder="e.g. PROD-X"
            />
          </div>
          <div className="field">
            <label>Location Code *</label>
            <input
              required
              value={form.locationCode}
              onChange={(e) => update('locationCode', e.target.value)}
            />
          </div>
        </div>

        <div className="field">
          <label>Adjustment Delta *</label>
          <input
            required
            type="number"
            value={form.delta}
            onChange={(e) => update('delta', parseInt(e.target.value) || 0)}
            placeholder="Positive to add, negative to subtract"
          />
          <p style={{ color: 'var(--muted)', marginTop: 8, fontSize: 13 }}>
            Example: <code>-5</code> removes 5 units. <code>+10</code> adds 10 units.
          </p>
        </div>

        <div className="field">
          <label>Reason *</label>
          <textarea
            required
            rows={3}
            value={form.reason}
            onChange={(e) => update('reason', e.target.value)}
            placeholder="e.g. Cycle count correction — found 5 extra units on back shelf"
          />
        </div>

        <div className="actions" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="btn-secondary" onClick={() => navigate('/')}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={adjust.isPending}>
            {adjust.isPending ? 'Adjusting...' : 'Apply Adjustment'}
          </button>
        </div>
      </form>
    </>
  );
}
