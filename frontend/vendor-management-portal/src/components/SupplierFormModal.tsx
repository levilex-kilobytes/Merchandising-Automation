import { FormEvent, useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { vendorApi } from '../api/vendor';
import { Supplier, CreateSupplierDto, PaymentTerms } from '../api/types';

interface Props {
  supplier: Supplier;
  onClose: () => void;
}

export function SupplierFormModal({ supplier, onClose }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState<CreateSupplierDto>({
    name: supplier.name,
    legalName: supplier.legalName ?? '',
    taxId: supplier.taxId ?? '',
    email: supplier.email ?? '',
    phone: supplier.phone ?? '',
    addressLine1: supplier.addressLine1 ?? '',
    addressLine2: supplier.addressLine2 ?? '',
    city: supplier.city ?? '',
    country: supplier.country,
    paymentTerms: supplier.paymentTerms,
    defaultCurrency: supplier.defaultCurrency,
    notes: supplier.notes ?? '',
  });

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [onClose]);

  const save = useMutation({
    mutationFn: () => vendorApi.updateSupplier(supplier.id, form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['supplier', supplier.id] });
      qc.invalidateQueries({ queryKey: ['suppliers'] });
      onClose();
    },
  });

  const update = (k: keyof CreateSupplierDto, v: string) =>
    setForm((p) => ({ ...p, [k]: v }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Edit Supplier</h3>
        {save.error && <div className="error-box">{(save.error as Error).message}</div>}

        <form onSubmit={submit}>
          <div className="field">
            <label>Name *</label>
            <input required value={form.name} onChange={(e) => update('name', e.target.value)} />
          </div>

          <div className="row">
            <div className="field">
              <label>Legal Name</label>
              <input value={form.legalName || ''} onChange={(e) => update('legalName', e.target.value)} />
            </div>
            <div className="field">
              <label>Tax ID</label>
              <input value={form.taxId || ''} onChange={(e) => update('taxId', e.target.value)} />
            </div>
          </div>

          <div className="row">
            <div className="field">
              <label>Email</label>
              <input type="email" value={form.email || ''} onChange={(e) => update('email', e.target.value)} />
            </div>
            <div className="field">
              <label>Phone</label>
              <input value={form.phone || ''} onChange={(e) => update('phone', e.target.value)} />
            </div>
          </div>

          <div className="field">
            <label>Address Line 1</label>
            <input value={form.addressLine1 || ''} onChange={(e) => update('addressLine1', e.target.value)} />
          </div>

          <div className="row">
            <div className="field">
              <label>City</label>
              <input value={form.city || ''} onChange={(e) => update('city', e.target.value)} />
            </div>
            <div className="field">
              <label>Country *</label>
              <input required value={form.country} onChange={(e) => update('country', e.target.value)} />
            </div>
          </div>

          <div className="row">
            <div className="field">
              <label>Payment Terms *</label>
              <select value={form.paymentTerms} onChange={(e) => update('paymentTerms', e.target.value as PaymentTerms)}>
                <option value="COD">COD</option>
                <option value="NET_15">NET 15</option>
                <option value="NET_30">NET 30</option>
                <option value="NET_60">NET 60</option>
                <option value="NET_90">NET 90</option>
              </select>
            </div>
            <div className="field">
              <label>Default Currency *</label>
              <input required minLength={3} maxLength={3} value={form.defaultCurrency}
                onChange={(e) => update('defaultCurrency', e.target.value.toUpperCase())} />
            </div>
          </div>

          <div className="field">
            <label>Notes</label>
            <textarea rows={3} value={form.notes || ''} onChange={(e) => update('notes', e.target.value)} />
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={save.isPending}>
              {save.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
