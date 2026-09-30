import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, ChevronRight, Plus, AlertTriangle, Building2, Search, X, DollarSign, History, Calendar } from 'lucide-react';
import { vendorsApi } from '../api/vendors';
import { Vendor, VendorProduct } from '../api/types';
import { useToast } from '../components/ToastProvider';
import { CurrencySelect } from '../components/CurrencySelect';
import { formatDateTime } from '../utils/format';

const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const fmt = (v: unknown, currency = 'KES') =>
  `${currency} ${num(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function FieldError({ message }: { message: string | null }) {
  if (!message) return null;
  return <div className="field-error"><AlertTriangle size={12} /> {message}</div>;
}

export function Products() {
  const [selected, setSelected] = useState<Vendor | null>(null);
  const [vendorSearch, setVendorSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [priceTarget, setPriceTarget] = useState<VendorProduct | null>(null);
  const [historyTarget, setHistoryTarget] = useState<VendorProduct | null>(null);
  const { push } = useToast();
  const qc = useQueryClient();

  const { data: vendors, isLoading: loadingVendors } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => vendorsApi.list(),
  });

  const { data: products, isLoading: loadingProducts, error: productsError } = useQuery({
    queryKey: ['vendor-products', selected?.id],
    queryFn: () => vendorsApi.listProducts(selected!.id),
    enabled: !!selected,
  });

  const activeVendors = useMemo(() => {
    const list = (vendors ?? []).filter((v) => v.status === 'active');
    const q = vendorSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter((v) =>
      v.name.toLowerCase().includes(q) ||
      (v.legalName ?? '').toLowerCase().includes(q) ||
      v.country.toLowerCase().includes(q),
    );
  }, [vendors, vendorSearch]);

  const filteredProducts = useMemo(() => {
    const list = products ?? [];
    const q = productSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter((p) =>
      p.productCode.toLowerCase().includes(q) ||
      p.productName.toLowerCase().includes(q),
    );
  }, [products, productSearch]);

  const addProduct = useMutation({
    mutationFn: (input: { productCode: string; productName: string; unitCost: number; currency: string; leadTimeDays: number; minOrderQty: number }) =>
      vendorsApi.addProduct(selected!.id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vendor-products', selected?.id] });
      push('Product added to catalog', 'success');
      setAddOpen(false);
    },
    onError: (e: unknown) => push(e instanceof Error ? e.message : 'Failed to add product', 'error'),
  });

  const changePrice = useMutation({
    mutationFn: ({ id, newCost, currency }: { id: string; newCost: number; currency: string }) =>
      vendorsApi.changePrice(id, { newCost, currency }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vendor-products', selected?.id] });
      push('Price updated', 'success');
      setPriceTarget(null);
    },
    onError: (e: unknown) => push(e instanceof Error ? e.message : 'Failed to change price', 'error'),
  });

  return <>
    <div className="page-header">
      <div>
        <h2>Product Catalog</h2>
        <p>Approved products and wholesale cost per supplier.</p>
      </div>
      {selected && (
        <button className="btn-primary" onClick={() => setAddOpen(true)}>
          <Plus size={16} /> Add product
        </button>
      )}
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: selected ? 'minmax(260px, 320px) 1fr' : '1fr', gap: 20 }}>
      <div className="card" style={{ marginBottom: 0, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: 16, borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Suppliers</h3>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
            <input
              value={vendorSearch}
              onChange={(e) => setVendorSearch(e.target.value)}
              placeholder="Filter suppliers…"
              style={{ paddingLeft: 30, paddingRight: vendorSearch ? 30 : 10, minHeight: 38, fontSize: 14 }}
            />
            {vendorSearch && (
              <button
                className="btn-ghost btn-sm"
                onClick={() => setVendorSearch('')}
                style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', minHeight: 26, padding: 3 }}
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        <div style={{ maxHeight: 560, overflowY: 'auto' }}>
          {loadingVendors && <div style={{ padding: 16 }}><div className="skeleton skeleton-row" /></div>}
          {activeVendors.length === 0 && !loadingVendors && (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
              {vendorSearch ? 'No suppliers match your search.' : 'No active suppliers yet.'}
            </div>
          )}
          {activeVendors.map((v) => {
            const isSel = selected?.id === v.id;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => { setSelected(v); setProductSearch(''); }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '12px 16px',
                  background: isSel ? 'var(--primary-soft)' : 'transparent',
                  border: 'none',
                  borderBottom: '1px solid var(--border)',
                  borderRadius: 0,
                  minHeight: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  cursor: 'pointer',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: isSel ? 'var(--primary)' : 'var(--text)' }}>{v.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                    {v.country} · {v.paymentTerms} · {v.defaultCurrency}
                  </div>
                </div>
                <ChevronRight size={14} style={{ color: isSel ? 'var(--primary)' : 'var(--muted)', flexShrink: 0 }} />
              </button>
            );
          })}
        </div>
      </div>

      {!selected && (
        <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
          <div className="empty" style={{ padding: 40 }}>
            <div className="empty-icon"><Package size={30} /></div>
            <div className="empty-title">Select a supplier</div>
            <div className="empty-hint">Choose a supplier from the list to view their approved product catalog.</div>
          </div>
        </div>
      )}

      {selected && (
        <div>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Building2 size={18} style={{ color: 'var(--primary)' }} />
                  <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{selected.name}</h3>
                </div>
                {selected.legalName && (
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{selected.legalName}</div>
                )}
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                  {selected.country} · {selected.paymentTerms} · Default: {selected.defaultCurrency}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>Catalog Items</div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{products?.length ?? '—'}</div>
              </div>
            </div>
          </div>

          <div className="filters" style={{ marginTop: 4 }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
              <input
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search products by code or name…"
                style={{ paddingLeft: 36, paddingRight: productSearch ? 36 : 12 }}
              />
              {productSearch && (
                <button
                  className="btn-ghost btn-sm"
                  onClick={() => setProductSearch('')}
                  style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', minHeight: 28, padding: 4 }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {loadingProducts && <div className="skeleton skeleton-row" />}
          {productsError && (
            <div className="error-box">
              Failed to load catalog: {productsError instanceof Error ? productsError.message : 'unknown'}
            </div>
          )}

          {products && filteredProducts.length === 0 && !loadingProducts && (
            <div className="empty">
              <div className="empty-icon"><Package size={30} /></div>
              <div className="empty-title">{productSearch ? 'No matching products' : 'Empty catalog'}</div>
              <div className="empty-hint">
                {productSearch
                  ? 'Try a different search term.'
                  : `Add the first product to ${selected.name}'s catalog. Procurement will only be able to order approved items.`}
              </div>
              {!productSearch && (
                <button className="btn-primary" onClick={() => setAddOpen(true)} style={{ marginTop: 16 }}>
                  <Plus size={16} /> Add first product
                </button>
              )}
            </div>
          )}

          {filteredProducts.length > 0 && (
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th className="num">Unit Cost</th>
                  <th className="num">Lead Time</th>
                  <th>Status</th>
                  <th style={{ width: 200 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="cell-product">
                        <strong>{p.productName}</strong>
                        <code>{p.productCode}</code>
                      </div>
                    </td>
                    <td className="num">
                      <span className="mono" style={{ fontWeight: 700 }}>{fmt(p.unitCost, p.currency)}</span>
                    </td>
                    <td className="num">
                      {num(p.leadTimeDays) > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                          <span style={{ fontWeight: 700 }}>{num(p.leadTimeDays)}</span>
                          <span style={{ fontSize: 11, color: 'var(--muted)' }}>days</span>
                        </div>
                      ) : <span style={{ color: 'var(--muted)' }}>Not set</span>}
                    </td>
                    <td>
                      <span className={`badge ${p.isActive ? 'badge-active' : 'badge-inactive'}`}>
                        {p.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="actions">
                        <button className="btn-ghost btn-sm" onClick={() => setHistoryTarget(p)}>
                          <History size={14} /> History
                        </button>
                        <button className="btn-ghost btn-sm" onClick={() => setPriceTarget(p)}>
                          <DollarSign size={14} /> Change price
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>

    {addOpen && selected && (
      <AddProductModal
        supplier={selected}
        onClose={() => setAddOpen(false)}
        onSave={(payload) => addProduct.mutate(payload)}
        pending={addProduct.isPending}
      />
    )}

    {priceTarget && (
      <ChangePriceModal
        product={priceTarget}
        onClose={() => setPriceTarget(null)}
        onSave={(payload) => changePrice.mutate({ id: priceTarget.id, ...payload })}
        pending={changePrice.isPending}
      />
    )}

    {historyTarget && selected && (
      <PriceHistoryModal
        supplier={selected}
        product={historyTarget}
        onClose={() => setHistoryTarget(null)}
      />
    )}
  </>;
}

function AddProductModal({
  supplier, onClose, onSave, pending,
}: {
  supplier: Vendor;
  onClose: () => void;
  onSave: (payload: { productCode: string; productName: string; unitCost: number; currency: string; leadTimeDays: number; minOrderQty: number }) => void;
  pending: boolean;
}) {
  const [productCode, setProductCode] = useState('');
  const [productName, setProductName] = useState('');
  const [unitCost, setUnitCost] = useState(0);
  const [currency, setCurrency] = useState(supplier.defaultCurrency);
  const [leadTimeDays, setLeadTimeDays] = useState(0);
  const [minOrderQty, setMinOrderQty] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!productCode.trim()) e.productCode = 'Product code is required';
    else if (productCode.trim().length > 100) e.productCode = 'Max 100 characters';
    if (!productName.trim()) e.productName = 'Product name is required';
    if (unitCost <= 0) e.unitCost = 'Unit cost must be greater than zero';
    if (!currency || currency.length !== 3) e.currency = 'Pick a 3-letter currency';
    if (leadTimeDays < 0) e.leadTimeDays = 'Cannot be negative';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">Add product to catalog</h3>
        <p className="modal-message">
          Register an approved product and its wholesale cost for <strong>{supplier.name}</strong>.
        </p>

        <div className={`field ${errors.productCode ? 'has-error' : ''}`}>
          <label>Product code <span style={{ color: 'var(--danger)' }}>*</span></label>
          <input
            value={productCode}
            onChange={(e) => { setProductCode(e.target.value); setErrors((prev) => { const n = { ...prev }; delete n.productCode; return n; }); }}
            placeholder="PROD-X"
            className={`mono ${errors.productCode ? 'input-error' : ''}`}
            autoFocus
          />
          <FieldError message={errors.productCode ?? null} />
        </div>

        <div className={`field ${errors.productName ? 'has-error' : ''}`}>
          <label>Product name <span style={{ color: 'var(--danger)' }}>*</span></label>
          <input
            value={productName}
            onChange={(e) => { setProductName(e.target.value); setErrors((prev) => { const n = { ...prev }; delete n.productName; return n; }); }}
            placeholder="Widget X"
            className={errors.productName ? 'input-error' : ''}
          />
          <FieldError message={errors.productName ?? null} />
        </div>

        <div className={`field ${errors.unitCost ? 'has-error' : ''}`}>
          <label>Wholesale unit cost <span style={{ color: 'var(--danger)' }}>*</span></label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={unitCost}
            onChange={(e) => { setUnitCost(Number(e.target.value) || 0); setErrors((prev) => { const n = { ...prev }; delete n.unitCost; return n; }); }}
            className={`mono ${errors.unitCost ? 'input-error' : ''}`}
          />
          <FieldError message={errors.unitCost ?? null} />
        </div>

        <div className={`field ${errors.currency ? 'has-error' : ''}`}>
          <label>Currency <span style={{ color: 'var(--danger)' }}>*</span></label>
          <CurrencySelect value={currency} onChange={(c) => { setCurrency(c); setErrors((prev) => { const n = { ...prev }; delete n.currency; return n; }); }} />
          <FieldError message={errors.currency ?? null} />
        </div>

        <div className={`field ${errors.leadTimeDays ? 'has-error' : ''}`}>
          <label>Lead time (days)</label>
          <input
            type="number"
            min={0}
            value={leadTimeDays}
            onChange={(e) => { setLeadTimeDays(Number(e.target.value) || 0); setErrors((prev) => { const n = { ...prev }; delete n.leadTimeDays; return n; }); }}
            className={errors.leadTimeDays ? 'input-error' : ''}
          />
          {errors.leadTimeDays
            ? <FieldError message={errors.leadTimeDays} />
            : <p className="field-help">Days from placing an order to delivery.</p>}
        </div>

        <div className={`field ${errors.minOrderQty ? 'has-error' : ''}`}>
          <label>Minimum order quantity <span style={{ color: 'var(--danger)' }}>*</span></label>
          <input
            type="number"
            min={1}
            value={minOrderQty}
            onChange={(e) => { setMinOrderQty(Number(e.target.value) || 0); setErrors((prev) => { const n = { ...prev }; delete n.minOrderQty; return n; }); }}
            className={errors.minOrderQty ? 'input-error' : ''}
          />
          {errors.minOrderQty
            ? <FieldError message={errors.minOrderQty} />
            : <p className="field-help">Smallest quantity we can order from this supplier.</p>}
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn-primary"
            disabled={pending}
            onClick={() => { if (validate()) onSave({ productCode: productCode.trim(), productName: productName.trim(), unitCost, currency, leadTimeDays, minOrderQty }); }}
          >
            {pending ? 'Adding…' : 'Add to catalog'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ChangePriceModal({
  product, onClose, onSave, pending,
}: {
  product: VendorProduct;
  onClose: () => void;
  onSave: (payload: { newCost: number; currency: string }) => void;
  pending: boolean;
}) {
  const [newCost, setNewCost] = useState(num(product.unitCost));
  const [currency, setCurrency] = useState(product.currency || 'KES');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (newCost <= 0) e.newCost = 'New cost must be greater than zero';
    if (!currency || currency.length !== 3) e.currency = 'Pick a 3-letter currency';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const diff = newCost - num(product.unitCost);
  const pct = num(product.unitCost) === 0 ? 0 : (diff / num(product.unitCost)) * 100;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">Change wholesale price</h3>
        <p className="modal-message">
          {product.productName} · <span className="mono">{product.productCode}</span>
        </p>

        <div style={{ padding: 12, background: 'var(--bg)', borderRadius: 8, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>Current price</span>
          <span className="mono" style={{ fontWeight: 700 }}>{fmt(product.unitCost, product.currency)}</span>
        </div>

        <div className={`field ${errors.newCost ? 'has-error' : ''}`}>
          <label>New cost <span style={{ color: 'var(--danger)' }}>*</span></label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={newCost}
            onChange={(e) => { setNewCost(Number(e.target.value) || 0); setErrors((prev) => { const n = { ...prev }; delete n.newCost; return n; }); }}
            className={`mono ${errors.newCost ? 'input-error' : ''}`}
            style={{ fontSize: 20, textAlign: 'center', fontWeight: 700 }}
            autoFocus
          />
          <FieldError message={errors.newCost ?? null} />
        </div>

        <div className={`field ${errors.currency ? 'has-error' : ''}`}>
          <label>Currency <span style={{ color: 'var(--danger)' }}>*</span></label>
          <CurrencySelect value={currency} onChange={(c) => { setCurrency(c); setErrors((prev) => { const n = { ...prev }; delete n.currency; return n; }); }} />
          <FieldError message={errors.currency ?? null} />
        </div>

        {diff !== 0 && (
          <div
            style={{
              padding: 12,
              borderRadius: 8,
              background: diff > 0 ? 'var(--danger-soft)' : 'var(--success-soft)',
              color: diff > 0 ? '#991b1b' : '#065f46',
              fontSize: 13,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {diff > 0 ? '↑' : '↓'} {diff > 0 ? 'Increase' : 'Decrease'} of {fmt(Math.abs(diff), currency)} ({pct.toFixed(1)}%)
          </div>
        )}

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn-primary"
            disabled={pending}
            onClick={() => { if (validate()) onSave({ newCost, currency }); }}
          >
            {pending ? 'Saving…' : 'Update price'}
          </button>
        </div>
      </div>
    </div>
  );
}

function PriceHistoryModal({
  supplier, product, onClose,
}: {
  supplier: Vendor;
  product: VendorProduct;
  onClose: () => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['price-history', supplier.id, product.productCode],
    queryFn: () => vendorsApi.priceHistory(supplier.id, product.productCode),
    retry: false,
  });

  const events = data ?? [];
  const endpointMissing = !isLoading && events.length === 0;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ width: 'min(100%, 560px)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <h3 className="modal-title">Price history</h3>
            <p className="modal-message" style={{ marginBottom: 0 }}>
              {product.productName} · <span className="mono">{product.productCode}</span>
            </p>
          </div>
          <button className="btn-ghost btn-sm" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </div>

        {isLoading && <div className="skeleton skeleton-row" />}

        {endpointMissing && (
          <div style={{ textAlign: 'center', padding: '32px 12px', color: 'var(--muted)' }}>
            <History size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
            <p style={{ fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>No price changes recorded yet</p>
            <p style={{ fontSize: 13 }}>Price changes for this product will appear here.</p>
          </div>
        )}

        {events.length > 0 && (
          <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {events.map((e, i) => (
              <li key={i} style={{ display: 'flex', gap: 12, paddingBottom: i < events.length - 1 ? 16 : 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--primary)', marginTop: 6, flexShrink: 0 }} />
                  {i < events.length - 1 && <div style={{ width: 2, flex: 1, background: 'var(--border)', marginTop: 4 }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }} className="mono">{fmt(e.unitCost, e.currency)}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={11} /> {formatDateTime(e.changedAt)}
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
