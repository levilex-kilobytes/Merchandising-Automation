import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Search, X, Plus, CheckCircle2, AlertTriangle, Pencil, Ban, History, ChevronRight, ChevronLeft, Mail, Phone, Calendar, Trash2, Package, Copy } from 'lucide-react';
import { vendorsApi } from '../api/vendors';
import { ApiError, getFieldError } from '../api/client';
import { Vendor, VendorHistoryEvent, PaymentTerms, SupplierStatus } from '../api/types';
import { useToast } from '../components/ToastProvider';
import { StatCard } from '../components/StatCard';
import { CountryCodeSelect, COUNTRIES, DEFAULT_COUNTRY } from '../components/CountryCodeSelect';
import { CurrencySelect } from '../components/CurrencySelect';
import { formatDateTime } from '../utils/format';

const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const PAYMENT_TERMS: Array<{ value: PaymentTerms; label: string }> = [
  { value: 'COD', label: 'COD — Cash on delivery' },
  { value: 'NET_15', label: 'Net 15 — pay within 15 days' },
  { value: 'NET_30', label: 'Net 30 — pay within 30 days' },
  { value: 'NET_60', label: 'Net 60 — pay within 60 days' },
  { value: 'NET_90', label: 'Net 90 — pay within 90 days' },
];

const STATUS_LABEL: Record<SupplierStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  blacklisted: 'Blacklisted',
};

function splitPhone(full: string | null | undefined): { dial: string; local: string } {
  const raw = str(full).trim();
  if (!raw) return { dial: DEFAULT_COUNTRY.dial, local: '' };
  const match = COUNTRIES
    .slice()
    .sort((a, b) => b.dial.length - a.dial.length)
    .find((c) => raw.startsWith(c.dial));
  if (match) {
    return { dial: match.dial, local: raw.slice(match.dial.length).replace(/[\s-]/g, '') };
  }
  return { dial: DEFAULT_COUNTRY.dial, local: raw.replace(/^\+/, '') };
}

const COUNTRY_NAMES = COUNTRIES.map((c) => c.name);

interface FormState {
  name: string;
  legalName: string;
  taxId: string;
  email: string;
  phoneDial: string;
  phoneLocal: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  country: string;
  paymentTerms: PaymentTerms;
  defaultCurrency: string;
  notes: string;
}

interface ProductDraft {
  key: string;
  productCode: string;
  productName: string;
  unitCost: number;
  currency: string;
  leadTimeDays: number;
  minOrderQty: number;
}

const emptyForm: FormState = {
  name: '', legalName: '', taxId: '', email: '',
  phoneDial: DEFAULT_COUNTRY.dial, phoneLocal: '',
  addressLine1: '', addressLine2: '', city: '',
  country: 'Kenya', paymentTerms: 'NET_30', defaultCurrency: 'KES', notes: '',
};

const newProduct = (currency = 'KES'): ProductDraft => ({
  key: crypto.randomUUID(),
  productCode: '',
  productName: '',
  unitCost: 0,
  currency,
  leadTimeDays: 0,
  minOrderQty: 1,
});

function FieldError({ message }: { message: string | null }) {
  if (!message) return null;
  return <div className="field-error"><AlertTriangle size={12} /> {message}</div>;
}

export function Vendors() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<SupplierStatus | ''>('active');
  const [mode, setMode] = useState<'closed' | 'create' | 'edit'>('closed');
  const [step, setStep] = useState<'form' | 'review'>('form');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [products, setProducts] = useState<ProductDraft[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [productErrors, setProductErrors] = useState<Record<string, string>>({});
  const [formBanner, setFormBanner] = useState<string | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<Vendor | null>(null);
  const [historyTarget, setHistoryTarget] = useState<Vendor | null>(null);
  const { push } = useToast();
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => vendorsApi.list(),
  });

  const rows: Vendor[] = data ?? [];

  const composedPhone = form.phoneLocal.trim()
    ? `${form.phoneDial}${form.phoneLocal.replace(/[\s-]/g, '')}`
    : '';

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    const serverKeys: Record<string, string[]> = {
      name: ['name'],
      legalName: ['legalName'],
      taxId: ['taxId'],
      email: ['email'],
      phoneLocal: ['phone'],
      phoneDial: ['phone'],
      addressLine1: ['addressLine1'],
      addressLine2: ['addressLine2'],
      city: ['city'],
      country: ['country'],
      paymentTerms: ['paymentTerms'],
      defaultCurrency: ['defaultCurrency'],
      notes: ['notes'],
    };
    const keys = serverKeys[key] ?? [key];
    setFieldErrors((prev) => {
      const next = { ...prev };
      for (const k of keys) delete next[k];
      return next;
    });
    if (formBanner) setFormBanner(null);
  };

  const setProduct = (key: string, patch: Partial<ProductDraft>) => {
    setProducts((prev) => prev.map((p) => (p.key === key ? { ...p, ...patch } : p)));
    setProductErrors((prev) => {
      const next = { ...prev };
      for (const k of Object.keys(next)) {
        if (k.startsWith(`${key}.`)) delete next[k];
      }
      return next;
    });
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Trading name is required';
    else if (form.name.trim().length < 2) errs.name = 'Must be at least 2 characters';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = 'Enter a valid email address';
    if (form.phoneLocal && !/^\d[\d\s-]{4,}$/.test(form.phoneLocal))
      errs.phoneLocal = 'Enter a valid phone number';
    if (!form.country.trim()) errs.country = 'Country is required';
    if (form.defaultCurrency.length !== 3)
      errs.defaultCurrency = 'Currency must be a 3-letter code';

    const perrs: Record<string, string> = {};
    const codeSet = new Set<string>();
    products.forEach((p) => {
      const hasAnything = p.productCode.trim() || p.productName.trim() || p.unitCost > 0;
      if (!hasAnything) return;
      if (!p.productCode.trim()) perrs[`${p.key}.productCode`] = 'Code is required';
      else if (codeSet.has(p.productCode.trim().toLowerCase()))
        perrs[`${p.key}.productCode`] = 'Duplicate code in this batch';
      else codeSet.add(p.productCode.trim().toLowerCase());
      if (!p.productName.trim()) perrs[`${p.key}.productName`] = 'Name is required';
      if (p.unitCost <= 0) perrs[`${p.key}.unitCost`] = 'Must be > 0';
      if (p.leadTimeDays < 0) perrs[`${p.key}.leadTimeDays`] = 'Cannot be negative';
      if (p.minOrderQty <= 0) perrs[`${p.key}.minOrderQty`] = 'Must be > 0';
      else if (!Number.isInteger(p.minOrderQty)) perrs[`${p.key}.minOrderQty`] = 'Whole number';
    });

    setFieldErrors(errs);
    setProductErrors(perrs);
    return Object.keys(errs).length === 0 && Object.keys(perrs).length === 0;
  };

  const validProducts = useMemo(
    () => products.filter((p) => p.productCode.trim() && p.productName.trim() && p.unitCost > 0),
    [products],
  );

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        legalName: form.legalName.trim() || undefined,
        taxId: form.taxId.trim() || undefined,
        email: form.email.trim() || undefined,
        phone: composedPhone || undefined,
        addressLine1: form.addressLine1.trim() || undefined,
        addressLine2: form.addressLine2.trim() || undefined,
        city: form.city.trim() || undefined,
        country: form.country.trim(),
        paymentTerms: form.paymentTerms,
        defaultCurrency: form.defaultCurrency,
        notes: form.notes.trim() || undefined,
      };

      const supplier = mode === 'edit' && editingId
        ? await vendorsApi.update(editingId, payload)
        : await vendorsApi.create(payload);

      if (mode === 'create' && validProducts.length > 0) {
        const results = await Promise.allSettled(
          validProducts.map((p) =>
            vendorsApi.addProduct(supplier.id, {
              productCode: p.productCode.trim(),
              productName: p.productName.trim(),
              unitCost: p.unitCost,
              currency: p.currency,
              leadTimeDays: p.leadTimeDays,
              minOrderQty: p.minOrderQty,
            }),
          ),
        );
        const failed = results.filter((r) => r.status === 'rejected').length;
        const ok = results.length - failed;
        return { supplier, productsAdded: ok, productsFailed: failed };
      }

      return { supplier, productsAdded: 0, productsFailed: 0 };
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['vendors'] });
      qc.invalidateQueries({ queryKey: ['vendor-products'] });
      if (result.productsFailed > 0) {
        push(
          `Supplier saved. ${result.productsAdded} product(s) added, ${result.productsFailed} failed.`,
          'error',
        );
      } else if (result.productsAdded > 0) {
        push(`Supplier created with ${result.productsAdded} product(s)`, 'success');
      } else {
        push(mode === 'edit' ? 'Supplier updated' : 'Supplier created', 'success');
      }
      closeModal();
    },
    onError: (e: unknown) => {
      if (e instanceof ApiError && Object.keys(e.fieldErrors).length > 0) {
        setFieldErrors(e.fieldErrors);
        setStep('form');
        setFormBanner('Please fix the highlighted fields below.');
      } else {
        push(e instanceof Error ? e.message : 'Save failed', 'error');
      }
    },
  });

  const deactivate = useMutation({
    mutationFn: (id: string) => vendorsApi.deactivate(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vendors'] }); push('Supplier deactivated', 'success'); setDeactivateTarget(null); },
    onError: (e: unknown) => push(e instanceof Error ? e.message : 'Deactivate failed', 'error'),
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((v) => {
      if (statusFilter && v.status !== statusFilter) return false;
      if (!q) return true;
      return (
        str(v.name).toLowerCase().includes(q) ||
        str(v.legalName).toLowerCase().includes(q) ||
        str(v.taxId).toLowerCase().includes(q) ||
        str(v.email).toLowerCase().includes(q) ||
        v.id.toLowerCase().includes(q)
      );
    });
  }, [rows, search, statusFilter]);

  const stats = useMemo(() => {
    const total = rows.length;
    const active = rows.filter((v) => v.status === 'active').length;
    const countries = new Set(rows.map((v) => str(v.country)).filter(Boolean)).size;
    return { total, active, countries };
  }, [rows]);

  const openCreate = () => {
    setForm(emptyForm);
    setProducts([]);
    setFieldErrors({});
    setProductErrors({});
    setFormBanner(null);
    setEditingId(null);
    setStep('form');
    setMode('create');
  };

  const openEdit = (v: Vendor) => {
    const { dial, local } = splitPhone(v.phone);
    setForm({
      name: str(v.name),
      legalName: str(v.legalName),
      taxId: str(v.taxId),
      email: str(v.email),
      phoneDial: dial,
      phoneLocal: local,
      addressLine1: str(v.addressLine1),
      addressLine2: str(v.addressLine2),
      city: str(v.city),
      country: str(v.country) || 'Kenya',
      paymentTerms: v.paymentTerms || 'NET_30',
      defaultCurrency: str(v.defaultCurrency) || 'KES',
      notes: str(v.notes),
    });
    setProducts([]);
    setFieldErrors({});
    setProductErrors({});
    setFormBanner(null);
    setEditingId(v.id);
    setStep('form');
    setMode('edit');
  };

  const closeModal = () => {
    setMode('closed'); setStep('form'); setEditingId(null);
    setForm(emptyForm); setProducts([]);
    setFieldErrors({}); setProductErrors({}); setFormBanner(null);
  };

  const copyId = (id: string) => {
    navigator.clipboard?.writeText(id).then(
      () => push('Supplier ID copied', 'success'),
      () => push('Copy failed', 'error'),
    );
  };

  const errName = getFieldError(fieldErrors, 'name');
  const errLegalName = getFieldError(fieldErrors, 'legalName');
  const errTaxId = getFieldError(fieldErrors, 'taxId');
  const errEmail = getFieldError(fieldErrors, 'email');
  const errPhone = getFieldError(fieldErrors, 'phoneLocal', 'phone');
  const errAddress1 = getFieldError(fieldErrors, 'addressLine1');
  const errCity = getFieldError(fieldErrors, 'city');
  const errCountry = getFieldError(fieldErrors, 'country');
  const errTerms = getFieldError(fieldErrors, 'paymentTerms');
  const errCurrency = getFieldError(fieldErrors, 'defaultCurrency');

  const productTotalCost = validProducts.reduce((s, p) => s + p.unitCost, 0);

  return <>
    <div className="page-header">
      <div><h2>Suppliers</h2><p>The authoritative list of who we buy from and on what terms.</p></div>
      <button className="btn-primary" onClick={openCreate}><Plus size={16} /> Add supplier</button>
    </div>

    <div className="summary">
      <StatCard icon={<Building2 size={22} />} label="Total Suppliers" value={stats.total} tone="primary" />
      <StatCard icon={<CheckCircle2 size={22} />} label="Active" value={stats.active} tone="success" />
      <StatCard icon={<Building2 size={22} />} label="Countries" value={stats.countries} tone="warning" />
    </div>

    <div className="filters">
      <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, legal name, tax ID, email, or ID…" style={{ paddingLeft: 36, paddingRight: search ? 36 : 12 }} />
        {search && <button className="btn-ghost btn-sm" onClick={() => setSearch('')} style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', minHeight: 28, padding: 4 }}><X size={14} /></button>}
      </div>
      <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as SupplierStatus | '')}>
        <option value="">All Statuses</option>
        <option value="active">Active Only</option>
        <option value="inactive">Inactive Only</option>
        <option value="blacklisted">Blacklisted Only</option>
      </select>
    </div>

    {isLoading && <div className="skeleton skeleton-row" />}
    {error && <div className="error-box">Failed to load suppliers: {error instanceof Error ? error.message : 'unknown'}</div>}

    {filtered.length === 0 && !isLoading && !error && (
      <div className="empty">
        <div className="empty-icon"><Building2 size={30} /></div>
        <div className="empty-title">{search ? 'No matching suppliers' : 'No suppliers yet'}</div>
        <div className="empty-hint">{search ? 'Try a different search term.' : 'Add your first supplier to get started.'}</div>
      </div>
    )}

    {filtered.length > 0 && (
      <table>
        <thead>
          <tr>
            <th>Supplier</th>
            <th>ID</th>
            <th>Tax ID</th>
            <th>Contact</th>
            <th>Country</th>
            <th>Terms</th>
            <th>Currency</th>
            <th>Status</th>
            <th style={{ width: 240 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((v) => (
            <tr key={v.id}>
              <td>
                <div className="cell-product">
                  <strong>{str(v.name)}</strong>
                  {v.legalName && <code>{str(v.legalName)}</code>}
                </div>
              </td>
              <td>
                <button
                  className="btn-ghost btn-sm"
                  onClick={() => copyId(v.id)}
                  title={`Copy full ID: ${v.id}`}
                  style={{ fontFamily: 'SF Mono, Menlo, monospace', fontSize: 12, padding: '3px 8px', minHeight: 26 }}
                >
                  {v.id.slice(0, 8)} <Copy size={11} />
                </button>
              </td>
              <td>
                {v.taxId ? <span className="mono" style={{ fontSize: 13 }}>{v.taxId}</span> : <span style={{ color: 'var(--muted)', fontSize: 13 }}>—</span>}
              </td>
              <td>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
                  {v.email && <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Mail size={12} style={{ color: 'var(--muted)' }} /> {v.email}</span>}
                  {v.phone && <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Phone size={12} style={{ color: 'var(--muted)' }} /> {v.phone}</span>}
                  {!v.email && !v.phone && <span style={{ color: 'var(--muted)' }}>No contact on file</span>}
                </div>
              </td>
              <td>{v.country || '—'}</td>
              <td><span className="mono" style={{ fontSize: 13 }}>{v.paymentTerms}</span></td>
              <td><span className="mono" style={{ fontSize: 13, fontWeight: 700 }}>{v.defaultCurrency}</span></td>
              <td><span className={`badge badge-${v.status}`}>{STATUS_LABEL[v.status]}</span></td>
              <td>
                <div className="actions">
                  <button className="btn-ghost btn-sm" onClick={() => setHistoryTarget(v)}><History size={14} /> History</button>
                  <button className="btn-ghost btn-sm" onClick={() => openEdit(v)}><Pencil size={14} /> Edit</button>
                  {v.status === 'active' && (
                    <button className="btn-ghost btn-sm" onClick={() => setDeactivateTarget(v)} style={{ color: 'var(--danger)' }}>
                      <Ban size={14} /> Deactivate
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )}

    {(mode === 'create' || mode === 'edit') && step === 'form' && (
      <div className="modal-backdrop" onClick={closeModal}>
        <div className="modal" onClick={(e) => e.stopPropagation()} style={{ width: 'min(100%, 720px)' }}>
          <h3 className="modal-title">{mode === 'edit' ? 'Edit supplier' : 'Add new supplier'}</h3>
          <p className="modal-message">
            {mode === 'edit' && editingId
              ? <>Editing supplier <span className="mono" style={{ fontSize: 12 }}>{editingId}</span>. You'll get a chance to review before saving.</>
              : "Fill in the details below. You can also add approved products for this supplier in the same flow."}
          </p>

          {formBanner && <div className="form-banner"><AlertTriangle size={16} /> {formBanner}</div>}

          <h4 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10, letterSpacing: 0.5 }}>Business identity</h4>

          <div className={`field ${errName ? 'has-error' : ''}`}>
            <label>Trading name <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="Acme Supplies" className={errName ? 'input-error' : ''} />
            {errName ? <FieldError message={errName} /> : <p className="field-help">The short name you'll see in lists and dropdowns.</p>}
          </div>

          <div className={`field ${errLegalName ? 'has-error' : ''}`}>
            <label>Legal name</label>
            <input value={form.legalName} onChange={(e) => setField('legalName', e.target.value)} placeholder="Acme Supplies Limited" className={errLegalName ? 'input-error' : ''} />
            {errLegalName ? <FieldError message={errLegalName} /> : <p className="field-help">The registered name as it appears on official documents.</p>}
          </div>

          <div className={`field ${errTaxId ? 'has-error' : ''}`}>
            <label>Tax ID</label>
            <input value={form.taxId} onChange={(e) => setField('taxId', e.target.value)} placeholder="P051234567X" className={`mono ${errTaxId ? 'input-error' : ''}`} />
            {errTaxId ? <FieldError message={errTaxId} /> : <p className="field-help">KRA PIN, VAT number, or equivalent tax ID.</p>}
          </div>

          <h4 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10, marginTop: 20, letterSpacing: 0.5 }}>Contact details</h4>

          <div className={`field ${errEmail ? 'has-error' : ''}`}>
            <label>Email address</label>
            <input type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} placeholder="orders@acme.co.ke" className={errEmail ? 'input-error' : ''} />
            {errEmail ? <FieldError message={errEmail} /> : <p className="field-help">Where purchase orders and invoices should be sent.</p>}
          </div>

          <div className={`field ${errPhone ? 'has-error' : ''}`}>
            <label>Phone number</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <CountryCodeSelect value={form.phoneDial} onChange={(dial) => setField('phoneDial', dial)} />
              <input type="tel" value={form.phoneLocal} onChange={(e) => setField('phoneLocal', e.target.value.replace(/[^\d\s-]/g, ''))} placeholder="700 000 000" className={`mono ${errPhone ? 'input-error' : ''}`} style={{ flex: 1 }} />
            </div>
            {errPhone ? <FieldError message={errPhone} /> : <p className="field-help">{form.phoneLocal ? `Will be saved as ${composedPhone}` : 'Select a country code and enter the local number.'}</p>}
          </div>

          <div className={`field ${errAddress1 ? 'has-error' : ''}`}>
            <label>Address line 1</label>
            <input value={form.addressLine1} onChange={(e) => setField('addressLine1', e.target.value)} placeholder="123 Industrial Way" className={errAddress1 ? 'input-error' : ''} />
            <FieldError message={errAddress1} />
          </div>

          <div className="field">
            <label>Address line 2</label>
            <input value={form.addressLine2} onChange={(e) => setField('addressLine2', e.target.value)} placeholder="Suite 4B" />
          </div>

          <div className={`field ${errCity ? 'has-error' : ''}`}>
            <label>City</label>
            <input value={form.city} onChange={(e) => setField('city', e.target.value)} placeholder="Nairobi" className={errCity ? 'input-error' : ''} />
            <FieldError message={errCity} />
          </div>

          <div className={`field ${errCountry ? 'has-error' : ''}`}>
            <label>Country <span style={{ color: 'var(--danger)' }}>*</span></label>
            <select value={form.country} onChange={(e) => setField('country', e.target.value)} className={errCountry ? 'input-error' : ''}>
              {COUNTRY_NAMES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {errCountry ? <FieldError message={errCountry} /> : <p className="field-help">Where the supplier is legally registered.</p>}
          </div>

          <h4 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10, marginTop: 20, letterSpacing: 0.5 }}>Supply terms</h4>

          <div className={`field ${errTerms ? 'has-error' : ''}`}>
            <label>Payment terms <span style={{ color: 'var(--danger)' }}>*</span></label>
            <select value={form.paymentTerms} onChange={(e) => setField('paymentTerms', e.target.value as PaymentTerms)} className={errTerms ? 'input-error' : ''}>
              {PAYMENT_TERMS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            {errTerms ? <FieldError message={errTerms} /> : <p className="field-help">Agreed timeframe for paying supplier invoices.</p>}
          </div>

          <div className={`field ${errCurrency ? 'has-error' : ''}`}>
            <label>Default currency <span style={{ color: 'var(--danger)' }}>*</span></label>
            <CurrencySelect value={form.defaultCurrency} onChange={(c) => {
              setField('defaultCurrency', c);
              setProducts((prev) => prev.map((p) => p.currency === form.defaultCurrency ? { ...p, currency: c } : p));
            }} />
            {errCurrency ? <FieldError message={errCurrency} /> : <p className="field-help">Currency used on this supplier's purchase orders.</p>}
          </div>

          <div className="field">
            <label>Notes</label>
            <textarea value={form.notes} onChange={(e) => setField('notes', e.target.value)} rows={2} placeholder="Payment instructions, contacts, special terms…" />
          </div>

          {mode === 'create' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 10 }}>
                <h4 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: 0.5, margin: 0 }}>
                  Product catalog <span style={{ textTransform: 'none', fontWeight: 500, letterSpacing: 0 }}>(optional)</span>
                </h4>
                <button className="btn-secondary btn-sm" onClick={() => setProducts((prev) => [...prev, newProduct(form.defaultCurrency)])}>
                  <Plus size={14} /> Add product
                </button>
              </div>

              <p className="field-help" style={{ marginBottom: 12 }}>
                Register products this supplier is approved to provide and their wholesale cost. Only approved products can be ordered on a PO.
              </p>

              {products.length === 0 && (
                <div style={{
                  padding: 20, textAlign: 'center', border: '1px dashed var(--border-strong)',
                  borderRadius: 'var(--radius-sm)', color: 'var(--muted)', fontSize: 13,
                }}>
                  <Package size={24} style={{ marginBottom: 6, opacity: 0.5 }} />
                  <p>No products added. You can add them later from the Products page.</p>
                </div>
              )}

              {products.map((p) => {
                const errCode = productErrors[`${p.key}.productCode`];
                const errNameP = productErrors[`${p.key}.productName`];
                const errCost = productErrors[`${p.key}.unitCost`];
                const errLead = productErrors[`${p.key}.leadTimeDays`];
                const errMoq = productErrors[`${p.key}.minOrderQty`];
                return (
                  <div key={p.key} className="line-item">
                    <div className="line-item-row" style={{ alignItems: 'flex-start' }}>
                      <div className={`field ${errCode ? 'has-error' : ''}`} style={{ flex: '1 1 160px' }}>
                        <label>Code</label>
                        <input value={p.productCode} onChange={(e) => setProduct(p.key, { productCode: e.target.value })} placeholder="PROD-X" className={`mono ${errCode ? 'input-error' : ''}`} />
                        <FieldError message={errCode ?? null} />
                      </div>
                      <div className={`field ${errNameP ? 'has-error' : ''}`} style={{ flex: '2 1 200px' }}>
                        <label>Name</label>
                        <input value={p.productName} onChange={(e) => setProduct(p.key, { productName: e.target.value })} placeholder="Widget X" className={errNameP ? 'input-error' : ''} />
                        <FieldError message={errNameP ?? null} />
                      </div>
                      <div className={`field ${errCost ? 'has-error' : ''}`} style={{ flex: '1 1 120px' }}>
                        <label>Unit cost</label>
                        <input type="number" min={0} step="0.01" value={p.unitCost} onChange={(e) => setProduct(p.key, { unitCost: Number(e.target.value) || 0 })} className={`mono ${errCost ? 'input-error' : ''}`} />
                        <FieldError message={errCost ?? null} />
                      </div>
                      <div className="field" style={{ flex: '0 0 120px' }}>
                        <label>Currency</label>
                        <select value={p.currency} onChange={(e) => setProduct(p.key, { currency: e.target.value })}>
                          <option value="KES">KES</option>
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                          <option value="GBP">GBP</option>
                          <option value="TZS">TZS</option>
                          <option value="UGX">UGX</option>
                          <option value="ZAR">ZAR</option>
                        </select>
                      </div>
                      <div className={`field ${errLead ? 'has-error' : ''}`} style={{ flex: '0 0 100px' }}>
                        <label>Lead (d)</label>
                        <input type="number" min={0} value={p.leadTimeDays} onChange={(e) => setProduct(p.key, { leadTimeDays: Number(e.target.value) || 0 })} className={errLead ? 'input-error' : ''} />
                        <FieldError message={errLead ?? null} />
                      </div>
                      <div className={`field ${errMoq ? 'has-error' : ''}`} style={{ flex: '0 0 100px' }}>
                        <label>Min order</label>
                        <input type="number" min={1} value={p.minOrderQty} onChange={(e) => setProduct(p.key, { minOrderQty: Number(e.target.value) || 0 })} className={errMoq ? 'input-error' : ''} />
                        <FieldError message={errMoq ?? null} />
                      </div>
                      <button
                        className="btn-ghost btn-sm"
                        style={{ alignSelf: 'flex-end', color: 'var(--danger)', marginBottom: 2 }}
                        onClick={() => setProducts((prev) => prev.filter((x) => x.key !== p.key))}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}

              {validProducts.length > 0 && (
                <div style={{ marginTop: 12, padding: 12, background: 'var(--bg)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--muted)' }}>
                    {validProducts.length} product{validProducts.length > 1 ? 's' : ''} will be added to the catalog
                  </span>
                  <span className="mono" style={{ fontWeight: 700 }}>
                    Sum of unit costs: {form.defaultCurrency} {productTotalCost.toFixed(2)}
                  </span>
                </div>
              )}
            </>
          )}

          <div className="modal-actions">
            <button className="btn-secondary" onClick={closeModal}>Cancel</button>
            <button className="btn-primary" onClick={() => { if (validate()) setStep('review'); }}>
              Review details <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    )}

    {(mode === 'create' || mode === 'edit') && step === 'review' && (
      <div className="modal-backdrop" onClick={closeModal}>
        <div className="modal" onClick={(e) => e.stopPropagation()} style={{ width: 'min(100%, 640px)' }}>
          <h3 className="modal-title">Review before {mode === 'edit' ? 'saving' : 'creating'}</h3>
          <p className="modal-message">Check everything looks right. Go back to edit, or confirm to proceed.</p>

          <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
            <h4 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8, letterSpacing: 0.5 }}>Business identity</h4>
            <Row label="Trading name" value={form.name} bold />
            <Row label="Legal name" value={form.legalName || 'Not provided'} />
            <Row label="Tax ID" value={form.taxId || 'Not provided'} mono />
            <Row
              label="Supplier ID"
              value={mode === 'edit' && editingId ? editingId.slice(0, 8) + '…' : '(assigned on save)'}
              mono
              last
            />

            <h4 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8, marginTop: 16, letterSpacing: 0.5 }}>Contact details</h4>
            <Row label="Email" value={form.email || 'Not provided'} />
            <Row label="Phone" value={composedPhone || 'Not provided'} mono />
            <Row label="Address" value={[form.addressLine1, form.addressLine2, form.city].filter(Boolean).join(', ') || 'Not provided'} last />

            <h4 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8, marginTop: 16, letterSpacing: 0.5 }}>Supply terms</h4>
            <Row label="Country" value={form.country} />
            <Row label="Payment terms" value={form.paymentTerms} />
            <Row label="Default currency" value={form.defaultCurrency} mono last />

            {mode === 'create' && validProducts.length > 0 && (
              <>
                <h4 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8, marginTop: 16, letterSpacing: 0.5 }}>
                  Product catalog ({validProducts.length})
                </h4>
                {validProducts.map((p) => (
                  <div key={p.key} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                    <span>
                      <strong>{p.productName}</strong>{' '}
                      <span className="mono" style={{ color: 'var(--muted)', fontSize: 11 }}>{p.productCode}</span>
                      {p.leadTimeDays > 0 && <span style={{ color: 'var(--muted)' }}> · {p.leadTimeDays}d</span>}
                      {p.minOrderQty > 1 && <span style={{ color: 'var(--muted)' }}> · min {p.minOrderQty}</span>}
                    </span>
                    <span className="mono" style={{ fontWeight: 700 }}>
                      {p.currency} {p.unitCost.toFixed(2)}
                    </span>
                  </div>
                ))}
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--muted)' }}>
                  Products are added to the catalog right after the supplier is created.
                </div>
              </>
            )}
          </div>

          <div className="modal-actions">
            <button className="btn-secondary" onClick={() => setStep('form')}><ChevronLeft size={16} /> Back to edit</button>
            <button className="btn-primary" disabled={save.isPending} onClick={() => save.mutate()}>
              {save.isPending
                ? 'Saving…'
                : mode === 'edit'
                  ? 'Save changes'
                  : validProducts.length > 0
                    ? `Create supplier + ${validProducts.length} product${validProducts.length > 1 ? 's' : ''}`
                    : 'Confirm and create'}
            </button>
          </div>
        </div>
      </div>
    )}

    {deactivateTarget && (
      <div className="modal-backdrop" onClick={() => setDeactivateTarget(null)}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--danger-soft)', color: 'var(--danger)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={26} />
            </div>
          </div>
          <h3 className="modal-title" style={{ textAlign: 'center' }}>Deactivate this supplier?</h3>
          <p className="modal-message" style={{ textAlign: 'center' }}>
            <strong>{str(deactivateTarget.name)}</strong> will be set to <strong>inactive</strong> and hidden from active lists.
          </p>
          <div className="modal-actions">
            <button className="btn-secondary" onClick={() => setDeactivateTarget(null)}>Keep active</button>
            <button className="btn-danger" disabled={deactivate.isPending} onClick={() => deactivate.mutate(deactivateTarget.id)}>
              {deactivate.isPending ? 'Deactivating…' : 'Yes, deactivate'}
            </button>
          </div>
        </div>
      </div>
    )}

    {historyTarget && <HistoryModal vendor={historyTarget} onClose={() => setHistoryTarget(null)} />}
  </>;
}

function Row({ label, value, mono, bold, last }: { label: string; value: string; mono?: boolean; bold?: boolean; last?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: last ? 'none' : '1px solid var(--border)' }}>
      <span style={{ color: 'var(--muted)', fontSize: 13 }}>{label}</span>
      <span className={mono ? 'mono' : ''} style={{ fontWeight: bold ? 700 : 600, fontSize: mono ? 13 : 14 }}>{value}</span>
    </div>
  );
}

function HistoryModal({ vendor, onClose }: { vendor: Vendor; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['vendor-history', vendor.id],
    queryFn: () => vendorsApi.getHistory(vendor.id),
  });

  const events: VendorHistoryEvent[] = data ?? [];
  const endpointMissing = !isLoading && events.length === 0;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ width: 'min(100%, 560px)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <h3 className="modal-title">History — {str(vendor.name)}</h3>
            <p className="modal-message" style={{ marginBottom: 0, fontFamily: 'SF Mono, Menlo, monospace', fontSize: 12 }}>{vendor.id}</p>
          </div>
          <button className="btn-ghost btn-sm" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </div>

        {isLoading && <div className="skeleton skeleton-row" />}

        {endpointMissing && (
          <div style={{ textAlign: 'center', padding: '32px 12px', color: 'var(--muted)' }}>
            <History size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
            <p style={{ fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>No history recorded yet</p>
            <p style={{ fontSize: 13 }}>Changes to this supplier will appear here.</p>
          </div>
        )}

        {events.length > 0 && (
          <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {events.map((e, i) => (
              <li key={e.id} style={{ display: 'flex', gap: 12, paddingBottom: i < events.length - 1 ? 16 : 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--primary)', marginTop: 6, flexShrink: 0 }} />
                  {i < events.length - 1 && <div style={{ width: 2, flex: 1, background: 'var(--border)', marginTop: 4 }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{e.description || e.eventType}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={11} /> {formatDateTime(e.occurredAt)}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose} style={{ flex: 1 }}>Close</button>
        </div>
      </div>
    </div>
  );
}
