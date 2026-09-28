import { FormEvent, useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { vendorApi } from '../api/vendor';
import { SupplierProduct, CreateSupplierProductDto } from '../api/types';

interface Props {
  supplierId: string;
  defaultCurrency: string;
  product?: SupplierProduct;
  onClose: () => void;
}

export function ProductFormModal({ supplierId, defaultCurrency, product, onClose }: Props) {
  const qc = useQueryClient();
  const isEdit = !!product;

  const [form, setForm] = useState<CreateSupplierProductDto>({
    productCode: product?.productCode ?? '',
    productName: product?.productName ?? '',
    unitCost: product?.unitCost ?? 0,
    currency: product?.currency ?? defaultCurrency,
    leadTimeDays: product?.leadTimeDays ?? 7,
    minOrderQty: product?.minOrderQty ?? 1,
  });

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [onClose]);

  const save = useMutation({
    mutationFn: () =>
      isEdit
        ? vendorApi.updateProduct(product!.id, {
            productName: form.productName,
            unitCost: form.unitCost,
            currency: form.currency,
            leadTimeDays: form.leadTimeDays,
            minOrderQty: form.minOrderQty,
          })
        : vendorApi.createProduct(supplierId, form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['supplier-products', supplierId] });
      qc.invalidateQueries({ queryKey: ['supplier', supplierId] });
      onClose();
    },
  });

  const update = (k: keyof CreateSupplierProductDto, v: string | number) =>
    setForm((p) => ({ ...p, [k]: v }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{isEdit ? 'Edit Product' : 'Add Product to Catalog'}</h3>

        {save.error && (
          <div className="error-box">{(save.error as Error).message}</div>
        )}

        <form onSubmit={submit}>
          <div className="row">
            <div className="field">
              <label>Product Code *</label>
              <input
                required
                value={form.productCode}
                onChange={(e) => update('productCode', e.target.value.toUpperCase())}
                placeholder="PROD-X"
                disabled={isEdit}
              />
            </div>
            <div className="field">
              <label>Product Name *</label>
              <input
                required
                value={form.productName}
                onChange={(e) => update('productName', e.target.value)}
                placeholder="Widget X"
              />
            </div>
          </div>

          <div className="row">
            <div className="field">
              <label>Unit Cost *</label>
              <input
                required
                type="number"
                min={0}
                step="0.01"
                value={form.unitCost}
                onChange={(e) => update('unitCost', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="field">
              <label>Currency *</label>
              <input
                required
                minLength={3}
                maxLength={3}
                value={form.currency}
                onChange={(e) => update('currency', e.target.value.toUpperCase())}
              />
            </div>
          </div>

          <div className="row">
            <div className="field">
              <label>Lead Time (days) *</label>
              <input
                required
                type="number"
                min={0}
                value={form.leadTimeDays}
                onChange={(e) => update('leadTimeDays', parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="field">
              <label>Min Order Qty *</label>
              <input
                required
                type="number"
                min={1}
                value={form.minOrderQty}
                onChange={(e) => update('minOrderQty', parseInt(e.target.value) || 1)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={save.isPending}>
              {save.isPending ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
