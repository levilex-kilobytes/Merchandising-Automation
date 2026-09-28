import { FormEvent, useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { vendorApi } from '../api/vendor';
import { SupplierProduct } from '../api/types';

interface Props {
  supplierId: string;
  product: SupplierProduct;
  onClose: () => void;
}

export function ChangePriceModal({ supplierId, product, onClose }: Props) {
  const qc = useQueryClient();
  const [newCost, setNewCost] = useState(product.unitCost);
  const [effectiveFrom, setEffectiveFrom] = useState(
    new Date().toISOString().split('T')[0],
  );

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [onClose]);

  const save = useMutation({
    mutationFn: () =>
      vendorApi.changePrice(product.id, { newCost, effectiveFrom }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['supplier-products', supplierId] });
      qc.invalidateQueries({ queryKey: ['price-history', supplierId, product.productCode] });
      onClose();
    },
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Change Price</h3>
        <p style={{ color: 'var(--muted)', marginBottom: 20 }}>
          <strong>{product.productName}</strong> · <code>{product.productCode}</code>
        </p>

        {save.error && (
          <div className="error-box">{(save.error as Error).message}</div>
        )}

        <form onSubmit={submit}>
          <div className="field">
            <label>Current Price</label>
            <div style={{ fontSize: 20, fontWeight: 600 }}>
              {product.currency} {product.unitCost.toLocaleString()}
            </div>
          </div>

          <div className="field">
            <label>New Price ({product.currency}) *</label>
            <input
              required
              type="number"
              min={0}
              step="0.01"
              value={newCost}
              onChange={(e) => setNewCost(parseFloat(e.target.value) || 0)}
            />
          </div>

          <div className="field">
            <label>Effective From *</label>
            <input
              required
              type="date"
              value={effectiveFrom}
              onChange={(e) => setEffectiveFrom(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={save.isPending}>
              {save.isPending ? 'Changing...' : 'Change Price'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
