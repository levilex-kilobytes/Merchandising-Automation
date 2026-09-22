import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { vendorApi } from '../api/vendor';
import { CreateSupplierDto, PaymentTerms } from '../api/types';

const initial: CreateSupplierDto = {
  name: '',
  legalName: '',
  taxId: '',
  email: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  country: 'Kenya',
  paymentTerms: 'NET_30',
  defaultCurrency: 'KES',
  notes: '',
};

export function CreateSupplier() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState<CreateSupplierDto>(initial);

  const create = useMutation({
    mutationFn: () => vendorApi.createSupplier(clean(form)),
    onSuccess: (supplier) => {
      qc.invalidateQueries({ queryKey: ['suppliers'] });
      navigate(`/suppliers/${supplier.id}`);
    },
  });

  const update = (key: keyof CreateSupplierDto, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    create.mutate();
  };

  return (
    <>
      <div className="page-header">
        <h2>New Supplier</h2>
      </div>

      {create.error && (
        <div className="error-box">
          {(create.error as Error).message || 'Failed to create supplier'}
        </div>
      )}

      <form className="card" onSubmit={submit}>
        <div className="field">
          <label>Name *</label>
          <input
            required
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="Acme Corp"
          />
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
            <select
              value={form.paymentTerms}
              onChange={(e) => update('paymentTerms', e.target.value as PaymentTerms)}
            >
              <option value="COD">COD</option>
              <option value="NET_15">NET 15</option>
              <option value="NET_30">NET 30</option>
              <option value="NET_60">NET 60</option>
              <option value="NET_90">NET 90</option>
            </select>
          </div>
          <div className="field">
            <label>Default Currency *</label>
            <input
              required
              maxLength={3}
              minLength={3}
              value={form.defaultCurrency}
              onChange={(e) => update('defaultCurrency', e.target.value.toUpperCase())}
            />
          </div>
        </div>

        <div className="field">
          <label>Notes</label>
          <textarea
            rows={3}
            value={form.notes || ''}
            onChange={(e) => update('notes', e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button type="button" className="btn-secondary" onClick={() => navigate('/')}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={create.isPending}>
            {create.isPending ? 'Creating...' : 'Create Supplier'}
          </button>
        </div>
      </form>
    </>
  );
}

function clean(dto: CreateSupplierDto): CreateSupplierDto {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(dto)) {
    if (v !== '' && v !== undefined && v !== null) out[k] = v;
  }
  return out as unknown as CreateSupplierDto;
}
