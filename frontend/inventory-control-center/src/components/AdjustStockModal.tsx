import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X, Plus, Minus } from 'lucide-react';
import { inventoryApi } from '../api/inventory';
import { useToast } from './ToastProvider';

export function AdjustStockModal({
  open, onClose, initialProductCode, initialLocationCode,
}: {
  open: boolean;
  onClose: () => void;
  initialProductCode?: string;
  initialLocationCode?: string;
}) {
  const { push } = useToast();
  const qc = useQueryClient();

  const [productCode, setProductCode] = useState(initialProductCode ?? '');
  const [locationCode, setLocationCode] = useState(initialLocationCode ?? 'MAIN');
  const [delta, setDelta] = useState(0);
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (open) {
      setProductCode(initialProductCode ?? '');
      setLocationCode(initialLocationCode ?? 'MAIN');
      setDelta(0);
      setReason('');
    }
  }, [open, initialProductCode, initialLocationCode]);

  const { data: locations } = useQuery({
    queryKey: ['locations'],
    queryFn: () => inventoryApi.listLocations(),
    enabled: open,
  });

  const { data: current } = useQuery({
    queryKey: ['stock-item', productCode, locationCode],
    queryFn: () => inventoryApi.getStockItem(productCode, locationCode),
    enabled: open && productCode.length > 0 && locationCode.length > 0,
    retry: false,
  });

  const adjust = useMutation({
    mutationFn: () => inventoryApi.adjustStock({ productCode, locationCode, delta, reason: reason || undefined }),
    onSuccess: (item) => {
      qc.invalidateQueries({ queryKey: ['stock'] });
      qc.invalidateQueries({ queryKey: ['movements'] });
      push(`Adjusted ${item.productCode} by ${delta > 0 ? '+' : ''}${delta}`, 'success');
      onClose();
    },
    onError: (e: unknown) => push(e instanceof Error ? e.message : 'Adjustment failed', 'error'),
  });

  if (!open) return null;

  const currentOnHand = current?.onHand ?? 0;
  const newOnHand = currentOnHand + delta;
  const invalid = !productCode.trim() || !locationCode.trim() || delta === 0 || newOnHand < 0;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 className="modal-title">Adjust stock</h3>
            <p className="modal-message">Increase or decrease the quantity on hand for a product at a location.</p>
          </div>
          <button className="btn-ghost btn-sm" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </div>

        <div className="field">
          <label>Product code</label>
          <input
            value={productCode}
            onChange={(e) => setProductCode(e.target.value)}
            placeholder="PROD-X"
            autoComplete="off"
            className="mono"
          />
        </div>

        <div className="field">
          <label>Location</label>
          <select value={locationCode} onChange={(e) => setLocationCode(e.target.value)}>
            <option value="MAIN">MAIN</option>
            {locations?.filter((l) => l !== 'MAIN').map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Adjustment (positive to add, negative to remove)</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn-secondary"
              onClick={() => setDelta((d) => d - 1)}
              aria-label="Decrease"
              style={{ minWidth: 44 }}
            >
              <Minus size={16} />
            </button>
            <input
              type="number"
              value={delta}
              onChange={(e) => setDelta(Number(e.target.value) || 0)}
              className="mono"
              style={{ textAlign: 'center', fontSize: 18, fontWeight: 700 }}
            />
            <button
              className="btn-secondary"
              onClick={() => setDelta((d) => d + 1)}
              aria-label="Increase"
              style={{ minWidth: 44 }}
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        <div className="field">
          <label>Reason (optional)</label>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Damaged in storage, cycle count correction"
          />
        </div>

        {productCode && (
          <div className="preview-box">
            <div className="preview-row">
              <span>Current on hand</span>
              <span className="value">{currentOnHand}</span>
            </div>
            <div className="preview-row">
              <span>Adjustment</span>
              <span className="value" style={{ color: delta > 0 ? 'var(--success)' : delta < 0 ? 'var(--danger)' : 'var(--muted)' }}>
                {delta > 0 ? '+' : ''}{delta}
              </span>
            </div>
            <div className="preview-row after">
              <span>New on hand</span>
              <span className="value" style={{ color: newOnHand < 0 ? 'var(--danger)' : 'var(--text)' }}>
                {newOnHand}
              </span>
            </div>
          </div>
        )}

        {newOnHand < 0 && (
          <div className="error-box" style={{ marginTop: 12, marginBottom: 0 }}>
            Cannot reduce below zero. Only {currentOnHand} units on hand.
          </div>
        )}

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn-primary"
            disabled={invalid || adjust.isPending}
            onClick={() => adjust.mutate()}
          >
            {adjust.isPending ? 'Applying…' : 'Apply adjustment'}
          </button>
        </div>
      </div>
    </div>
  );
}
