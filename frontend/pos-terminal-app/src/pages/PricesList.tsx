import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tag, Plus, AlertTriangle, X } from 'lucide-react';
import { retailApi } from '../api/retail';
import { useState } from 'react';
import { useToast } from '../components/ToastProvider';

const fmt = (n: number) => `KES ${n.toFixed(2)}`;

export function PricesList() {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const { push } = useToast();

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
        <button className="btn-primary" onClick={() => setOpen(true)}>
          <Plus size={16} /> New price
        </button>
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

      {open && <CreatePriceModal onClose={() => setOpen(false)} onSuccess={() => { qc.invalidateQueries({ queryKey: ['prices'] }); setOpen(false); push('Price created', 'success'); }} />}
    </>
  );
}

function CreatePriceModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { push } = useToast();
  const [productCode, setProductCode] = useState('');
  const [productName, setProductName] = useState('');
  const [unitPrice, setUnitPrice] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const create = useMutation({
    mutationFn: () => retailApi.createPrice({ productCode: productCode.trim(), productName: productName.trim() || productCode.trim(), unitPrice }),
    onSuccess,
    onError: (e: unknown) => push(e instanceof Error ? e.message : 'Failed to create price', 'error'),
  });

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!productCode.trim()) e.productCode = 'Code is required';
    if (unitPrice <= 0) e.unitPrice = 'Must be greater than zero';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h3 className="modal-title">New retail price</h3>
          <button className="btn-ghost btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <p className="modal-message">Add a sellable product so the terminal can price it.</p>

        <div className="field">
          <label>Product code</label>
          <input value={productCode} onChange={(e) => setProductCode(e.target.value)} placeholder="c21" className="mono" autoFocus />
          {errors.productCode && <div className="field-error"><AlertTriangle size={12} /> {errors.productCode}</div>}
        </div>
        <div className="field">
          <label>Product name (optional)</label>
          <input value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="Widget X" />
        </div>
        <div className="field">
          <label>Unit price (KES)</label>
          <input type="number" min={0} step="0.01" value={unitPrice} onChange={(e) => setUnitPrice(Number(e.target.value) || 0)} className="mono" />
          {errors.unitPrice && <div className="field-error"><AlertTriangle size={12} /> {errors.unitPrice}</div>}
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={create.isPending} onClick={() => { if (validate()) create.mutate(); }}>
            {create.isPending ? 'Creating…' : 'Create price'}
          </button>
        </div>
      </div>
    </div>
  );
}
