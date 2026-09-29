import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, CheckCircle2, Clock, Plus, Send, Trash2, AlertTriangle, Calendar } from 'lucide-react';
import { poApi } from '../api/purchaseOrders';
import { listSuppliers, SupplierOption } from '../api/suppliers';
import { ApiError, getFieldError } from '../api/client';
import { useToast } from '../components/ToastProvider';
import { StatCard } from '../components/StatCard';
import { PurchaseOrder, POStatus } from '../api/types';
import { formatDate } from '../utils/format';

const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const fmtMoney = (v: unknown, currency = 'KES'): string =>
  `${currency} ${num(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const statuses: Array<{ value: POStatus | ''; label: string }> = [
  { value: '', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'sent', label: 'Sent' },
  { value: 'received', label: 'Received' },
  { value: 'closed', label: 'Closed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const STATUS_LABEL: Record<POStatus, string> = {
  draft: 'Draft',
  pending: 'Pending approval',
  approved: 'Approved',
  sent: 'Sent to supplier',
  received: 'Received',
  closed: 'Closed',
  cancelled: 'Cancelled',
};

interface LineDraft {
  key: string;
  productCode: string;
  quantity: number;
}

const newLine = (): LineDraft => ({
  key: crypto.randomUUID(),
  productCode: '',
  quantity: 1,
});

function isoDateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function FieldError({ message }: { message: string | null }) {
  if (!message) return null;
  return <div className="field-error"><AlertTriangle size={12} /> {message}</div>;
}

export function PurchaseOrders() {
  const [statusFilter, setStatusFilter] = useState<POStatus | ''>('');
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'form' | 'review'>('form');
  const [supplierId, setSupplierId] = useState('');
  const [currency, setCurrency] = useState('KES');
  const [expectedDate, setExpectedDate] = useState(isoDateOffset(7));
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<LineDraft[]>([newLine()]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formBanner, setFormBanner] = useState<string | null>(null);
  const [approveTarget, setApproveTarget] = useState<PurchaseOrder | null>(null);
  const [cancelTarget, setCancelTarget] = useState<PurchaseOrder | null>(null);
  const { push } = useToast();
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['pos'],
    queryFn: () => poApi.list(),
  });

  const { data: suppliers, isLoading: loadingSuppliers, error: suppliersError } = useQuery({
    queryKey: ['supplier-options'],
    queryFn: listSuppliers,
    enabled: open,
    retry: false,
  });

  const selectedSupplier: SupplierOption | null = useMemo(
    () => (suppliers ?? []).find((s) => s.id === supplierId) ?? null,
    [suppliers, supplierId],
  );

  useEffect(() => {
    if (selectedSupplier) setCurrency(selectedSupplier.defaultCurrency);
  }, [selectedSupplier]);

  const create = useMutation({
    mutationFn: () =>
      poApi.create({
        supplierId,
        currency,
        expectedDate,
        notes: notes || undefined,
        lines: lines
          .filter((l) => l.productCode.trim())
          .map(({ productCode, quantity }) => ({ productCode: productCode.trim(), quantity })),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pos'] });
      push('Purchase order created', 'success');
      closeModal();
    },
    onError: (e: unknown) => {
      if (e instanceof ApiError && Object.keys(e.fieldErrors).length > 0) {
        setFieldErrors(e.fieldErrors);
        setStep('form');
        setFormBanner('Please fix the highlighted fields below.');
      } else {
        push(e instanceof Error ? e.message : 'Failed to create PO', 'error');
      }
    },
  });

  const submit = useMutation({
    mutationFn: (id: string) => poApi.submit(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pos'] }); push('PO submitted for approval', 'success'); },
    onError: (e: unknown) => push(e instanceof Error ? e.message : 'Submit failed', 'error'),
  });

  const approve = useMutation({
    mutationFn: ({ id, approvedBy }: { id: string; approvedBy: string }) => poApi.approve(id, approvedBy),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pos'] }); push('PO approved', 'success'); setApproveTarget(null); },
    onError: (e: unknown) => push(e instanceof Error ? e.message : 'Approve failed', 'error'),
  });

  const send = useMutation({
    mutationFn: (id: string) => poApi.send(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pos'] }); push('PO sent to supplier', 'success'); },
    onError: (e: unknown) => push(e instanceof Error ? e.message : 'Send failed', 'error'),
  });

  const close = useMutation({
    mutationFn: (id: string) => poApi.close(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pos'] }); push('PO closed', 'success'); },
    onError: (e: unknown) => push(e instanceof Error ? e.message : 'Close failed', 'error'),
  });

  const cancel = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => poApi.cancel(id, reason),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pos'] }); push('PO cancelled', 'info'); setCancelTarget(null); },
    onError: (e: unknown) => push(e instanceof Error ? e.message : 'Cancel failed', 'error'),
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    if (!statusFilter) return data;
    return data.filter((p) => p.status === statusFilter);
  }, [data, statusFilter]);

  const stats = useMemo(() => {
    if (!data) return { total: 0, pending: 0, committed: 0 };
    return {
      total: data.length,
      pending: data.filter((p) => p.status === 'pending').length,
      committed: data
        .filter((p) => ['approved', 'sent'].includes(p.status))
        .reduce((s, p) => s + num(p.totalCost), 0),
    };
  }, [data]);

  const setLine = (key: string, patch: Partial<LineDraft>) => {
    setLines((prev) => prev.map((x) => (x.key === key ? { ...x, ...patch } : x)));
    const idx = lines.findIndex((l) => l.key === key);
    setFieldErrors((prev) => {
      const next = { ...prev };
      for (const k of Object.keys(next)) {
        if (k.startsWith(`lines.${idx}`)) delete next[k];
      }
      return next;
    });
    if (formBanner) setFormBanner(null);
  };

  const setField = (clearKeys: string[]) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      for (const k of clearKeys) delete next[k];
      return next;
    });
    if (formBanner) setFormBanner(null);
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!supplierId) errs.supplierId = 'Select a supplier';
    if (!currency || currency.length !== 3) errs.currency = 'Currency must be a 3-letter code';
    if (!expectedDate) errs.expectedDate = 'Expected date is required';
    else if (new Date(expectedDate) < new Date(new Date().toDateString())) {
      errs.expectedDate = 'Expected date cannot be in the past';
    }
    const usable = lines.filter((l) => l.productCode.trim());
    if (usable.length === 0) errs.lines = 'Add at least one item';
    lines.forEach((l, i) => {
      if (!l.productCode.trim() && l.quantity === 1) return;
      if (!l.productCode.trim()) errs[`lines.${i}.productCode`] = 'SKU is required';
      if (l.quantity <= 0) errs[`lines.${i}.quantity`] = 'Must be greater than zero';
      else if (!Number.isInteger(l.quantity)) errs[`lines.${i}.quantity`] = 'Must be a whole number';
    });
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const closeModal = () => {
    setOpen(false);
    setStep('form');
    setSupplierId('');
    setCurrency('KES');
    setExpectedDate(isoDateOffset(7));
    setNotes('');
    setLines([newLine()]);
    setFieldErrors({});
    setFormBanner(null);
  };

  const openModal = () => {
    setSupplierId('');
    setCurrency('KES');
    setExpectedDate(isoDateOffset(7));
    setNotes('');
    setLines([newLine()]);
    setFieldErrors({});
    setFormBanner(null);
    setStep('form');
    setOpen(true);
  };

  const errSupplier = getFieldError(fieldErrors, 'supplierId', 'supplier_id');
  const errCurrency = getFieldError(fieldErrors, 'currency');
  const errExpectedDate = getFieldError(fieldErrors, 'expectedDate', 'expected_date');
  const errLines = getFieldError(fieldErrors, 'lines');
  const errNotes = getFieldError(fieldErrors, 'notes');

  const totalQty = lines.filter((l) => l.productCode.trim()).reduce((s, l) => s + l.quantity, 0);

  return <>
    <div className="page-header">
      <div><h2>Purchase Orders</h2><p>Every commitment to buy, from draft to received.</p></div>
      <button className="btn-primary" onClick={openModal}><Plus size={16} /> New PO</button>
    </div>

    <div className="summary">
      <StatCard icon={<FileText size={22} />} label="Total POs" value={stats.total} tone="primary" />
      <StatCard icon={<Clock size={22} />} label="Awaiting Approval" value={stats.pending} tone={stats.pending > 0 ? 'warning' : 'success'} />
      <StatCard icon={<CheckCircle2 size={22} />} label="Committed Value" value={fmtMoney(stats.committed)} tone="success" />
    </div>

    <div className="filters">
      {statuses.map((s) => (
        <button key={s.value || 'all'} className={`btn-${statusFilter === s.value ? 'primary' : 'ghost'} btn-sm`} onClick={() => setStatusFilter(s.value)}>
          {s.label}
        </button>
      ))}
    </div>

    {isLoading && <div className="skeleton skeleton-row" />}
    {error && <div className="error-box">Failed to load purchase orders: {error instanceof Error ? error.message : 'unknown'}</div>}

    {data && filtered.length === 0 && (
      <div className="empty">
        <div className="empty-icon"><FileText size={30} /></div>
        <div className="empty-title">{statusFilter ? `No ${STATUS_LABEL[statusFilter].toLowerCase()} POs` : 'No purchase orders yet'}</div>
        <div className="empty-hint">{statusFilter ? 'Try a different status filter.' : 'Create your first PO to start committing purchases.'}</div>
      </div>
    )}

    {filtered.length > 0 && (
      <table>
        <thead>
          <tr>
            <th>PO Reference</th>
            <th>Supplier</th>
            <th className="num">Total</th>
            <th>Progress</th>
            <th>Expected</th>
            <th>Status</th>
            <th>Created</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((po) => {
            const totalQ = po.lines?.reduce((s, l) => s + num(l.orderedQty), 0) ?? 0;
            const receivedQ = po.lines?.reduce((s, l) => s + num(l.receivedQty), 0) ?? 0;
            const pct = totalQ === 0 ? 0 : Math.round((receivedQ / totalQ) * 100);
            return <tr key={po.id}>
              <td><span className="mono" style={{ fontWeight: 700 }}>{po.id.slice(0, 8)}</span></td>
              <td>{po.supplierName}</td>
              <td className="num">{fmtMoney(po.totalCost, po.currency)}</td>
              <td>
                {totalQ > 0 ? (
                  <>
                    <div className="progress-bar"><div className={`progress-fill ${pct === 100 ? 'complete' : ''}`} style={{ width: `${pct}%` }} /></div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{receivedQ} / {totalQ} received</div>
                  </>
                ) : <span style={{ color: 'var(--muted)' }}>—</span>}
              </td>
              <td style={{ whiteSpace: 'nowrap', fontSize: 13, color: 'var(--muted)' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Calendar size={11} /> {po.expectedDate ? formatDate(po.expectedDate) : '—'}
                </span>
              </td>
              <td><span className={`badge badge-${po.status}`}>{STATUS_LABEL[po.status]}</span></td>
              <td style={{ whiteSpace: 'nowrap', fontSize: 13, color: 'var(--muted)' }}>{formatDate(po.createdAt)}</td>
              <td>
                <div className="actions">
                  {po.status === 'draft' && (
                    <button className="btn-primary btn-sm" onClick={() => submit.mutate(po.id)} disabled={submit.isPending}>
                      Submit for approval
                    </button>
                  )}
                  {po.status === 'pending' && (
                    <button className="btn-success btn-sm" onClick={() => setApproveTarget(po)} disabled={approve.isPending}>
                      <CheckCircle2 size={12} /> Approve
                    </button>
                  )}
                  {po.status === 'approved' && (
                    <button className="btn-primary btn-sm" onClick={() => send.mutate(po.id)} disabled={send.isPending}>
                      <Send size={12} /> Send
                    </button>
                  )}
                  {po.status === 'received' && (
                    <button className="btn-primary btn-sm" onClick={() => close.mutate(po.id)} disabled={close.isPending}>
                      Close PO
                    </button>
                  )}
                  {['draft', 'pending', 'approved'].includes(po.status) && (
                    <button className="btn-ghost btn-sm" onClick={() => setCancelTarget(po)} disabled={cancel.isPending}>
                      Cancel
                    </button>
                  )}
                </div>
              </td>
            </tr>;
          })}
        </tbody>
      </table>
    )}

    {open && step === 'form' && (
      <div className="modal-backdrop" onClick={closeModal}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <h3 className="modal-title">New purchase order</h3>
          <p className="modal-message">Commit to a new purchase from an approved supplier.</p>

          {formBanner && <div className="form-banner"><AlertTriangle size={16} /> {formBanner}</div>}

          <h4 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10, letterSpacing: 0.5 }}>Supplier</h4>

          <div className={`field ${errSupplier ? 'has-error' : ''}`}>
            <label>Supplier <span style={{ color: 'var(--danger)' }}>*</span></label>

            {loadingSuppliers && <div className="skeleton skeleton-row" style={{ height: 42 }} />}

            {suppliersError && (
              <div className="error-box" style={{ marginBottom: 0 }}>
                <AlertTriangle size={14} /> {suppliersError instanceof Error ? suppliersError.message : 'Could not load suppliers.'}
              </div>
            )}

            {suppliers && (
              <select
                value={supplierId}
                onChange={(e) => { setSupplierId(e.target.value); setField(['supplierId', 'supplier_id']); }}
                className={errSupplier ? 'input-error' : ''}
              >
                <option value="">— Choose a supplier —</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}{s.country ? ` — ${s.country}` : ''}{s.defaultCurrency ? ` (${s.defaultCurrency})` : ''}
                  </option>
                ))}
              </select>
            )}

            {errSupplier
              ? <FieldError message={errSupplier} />
              : <p className="field-help">
                  {selectedSupplier
                    ? `Selected: ${selectedSupplier.name} · ${selectedSupplier.paymentTerms}`
                    : 'Choose which approved supplier this PO is placed with.'}
                </p>}
          </div>

          <div className={`field ${errCurrency ? 'has-error' : ''}`}>
            <label>Currency <span style={{ color: 'var(--danger)' }}>*</span></label>
            <select
              value={currency}
              onChange={(e) => { setCurrency(e.target.value); setField(['currency']); }}
              className={errCurrency ? 'input-error' : ''}
            >
              <option value="KES">KES — Kenyan Shilling</option>
              <option value="USD">USD — US Dollar</option>
              <option value="EUR">EUR — Euro</option>
              <option value="GBP">GBP — British Pound</option>
              <option value="TZS">TZS — Tanzanian Shilling</option>
              <option value="UGX">UGX — Ugandan Shilling</option>
              <option value="ZAR">ZAR — South African Rand</option>
            </select>
            {errCurrency ? <FieldError message={errCurrency} /> : <p className="field-help">Auto-filled from the supplier's default. Override if needed.</p>}
          </div>

          <div className={`field ${errExpectedDate ? 'has-error' : ''}`}>
            <label>Expected delivery date <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input
              type="date"
              value={expectedDate}
              onChange={(e) => { setExpectedDate(e.target.value); setField(['expectedDate', 'expected_date']); }}
              className={errExpectedDate ? 'input-error' : ''}
            />
            {errExpectedDate ? <FieldError message={errExpectedDate} /> : <p className="field-help">When you expect the goods to arrive at your dock.</p>}
          </div>

          <h4 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10, marginTop: 20, letterSpacing: 0.5 }}>Line items</h4>

          {errLines && <div className="form-banner"><AlertTriangle size={14} /> {errLines}</div>}

          {lines.map((l, i) => {
            const errCode = getFieldError(fieldErrors, `lines.${i}.productCode`, `lines.${i}.product_code`);
            const errQty = getFieldError(fieldErrors, `lines.${i}.quantity`);
            return (
              <div key={l.key} className="line-item">
                <div className="line-item-row">
                  <div className={`field ${errCode ? 'has-error' : ''}`} style={{ flex: 3 }}>
                    <label>Product code</label>
                    <input
                      value={l.productCode}
                      onChange={(e) => setLine(l.key, { productCode: e.target.value })}
                      placeholder="PROD-X"
                      className={`mono ${errCode ? 'input-error' : ''}`}
                    />
                    <FieldError message={errCode} />
                  </div>
                  <div className={`field ${errQty ? 'has-error' : ''}`} style={{ flex: 1 }}>
                    <label>Quantity</label>
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={l.quantity}
                      onChange={(e) => setLine(l.key, { quantity: Number(e.target.value) || 0 })}
                      className={errQty ? 'input-error' : ''}
                    />
                    <FieldError message={errQty} />
                  </div>
                  <button
                    className="btn-ghost btn-sm"
                    style={{ alignSelf: 'flex-end', color: 'var(--danger)' }}
                    disabled={lines.length === 1}
                    onClick={() => setLines((prev) => prev.filter((x) => x.key !== l.key))}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}

          <button className="btn-secondary btn-sm" onClick={() => setLines((prev) => [...prev, newLine()])} style={{ marginTop: 4 }}>
            <Plus size={14} /> Add line
          </button>

          <p className="field-help" style={{ marginTop: 8 }}>
            Unit costs are locked in from the supplier's approved catalog when the PO is created.
          </p>

          <div className={`field ${errNotes ? 'has-error' : ''}`} style={{ marginTop: 16 }}>
            <label>Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => { setNotes(e.target.value); setField(['notes']); }}
              rows={2}
              placeholder="Delivery window, shipping instructions, payment details…"
              className={errNotes ? 'input-error' : ''}
            />
            <FieldError message={errNotes} />
          </div>

          <div className="modal-actions">
            <button className="btn-secondary" onClick={closeModal}>Cancel</button>
            <button className="btn-primary" onClick={() => { if (validate()) setStep('review'); }}>
              Review order
            </button>
          </div>
        </div>
      </div>
    )}

    {open && step === 'review' && (
      <div className="modal-backdrop" onClick={closeModal}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <h3 className="modal-title">Review before creating</h3>
          <p className="modal-message">Check everything looks right, then confirm to place the order.</p>

          <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
            <h4 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8, letterSpacing: 0.5 }}>Order details</h4>
            <Row label="Supplier" value={selectedSupplier?.name ?? '—'} bold />
            <Row label="Currency" value={currency} mono />
            <Row label="Expected delivery" value={formatDate(expectedDate)} last />

            <h4 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8, marginTop: 16, letterSpacing: 0.5 }}>
              Items ({lines.filter((l) => l.productCode.trim()).length})
            </h4>
            {lines.filter((l) => l.productCode.trim()).map((l) => (
              <div key={l.key} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                <span className="mono">{l.productCode}</span>
                <span style={{ color: 'var(--muted)' }}>{l.quantity} units</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0', marginTop: 8 }}>
              <span style={{ fontWeight: 700 }}>Total quantity</span>
              <span className="mono" style={{ fontWeight: 800, fontSize: 18 }}>{totalQty} units</span>
            </div>

            {notes && (
              <>
                <h4 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6, marginTop: 16, letterSpacing: 0.5 }}>Notes</h4>
                <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>{notes}</p>
              </>
            )}
          </div>

          <p className="field-help" style={{ marginTop: 12, textAlign: 'center' }}>
            The backend will lock in unit costs from the supplier's approved catalog and compute the total.
          </p>

          <div className="modal-actions">
            <button className="btn-secondary" onClick={() => setStep('form')}>Back to edit</button>
            <button className="btn-primary" disabled={create.isPending} onClick={() => create.mutate()}>
              {create.isPending ? 'Creating…' : 'Confirm and create PO'}
            </button>
          </div>
        </div>
      </div>
    )}

    {approveTarget && (
      <ApproveDialog
        po={approveTarget}
        onCancel={() => setApproveTarget(null)}
        onConfirm={(approvedBy) => approve.mutate({ id: approveTarget.id, approvedBy })}
        pending={approve.isPending}
      />
    )}

    {cancelTarget && (
      <CancelDialog
        po={cancelTarget}
        onCancel={() => setCancelTarget(null)}
        onConfirm={(reason) => cancel.mutate({ id: cancelTarget.id, reason })}
        pending={cancel.isPending}
      />
    )}
  </>;
}

function Row({ label, value, mono, bold, last }: { label: string; value: string; mono?: boolean; bold?: boolean; last?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: last ? 'none' : '1px solid var(--border)' }}>
      <span style={{ color: 'var(--muted)', fontSize: 13 }}>{label}</span>
      <span className={mono ? 'mono' : ''} style={{ fontWeight: bold ? 700 : 600 }}>{value}</span>
    </div>
  );
}

function ApproveDialog({
  po, onCancel, onConfirm, pending,
}: {
  po: PurchaseOrder;
  onCancel: () => void;
  onConfirm: (approvedBy: string) => void;
  pending: boolean;
}) {
  const [approvedBy, setApprovedBy] = useState('');
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">Approve purchase order</h3>
        <p className="modal-message">Sign off on {po.id.slice(0, 8)} so it can be sent to {po.supplierName}.</p>
        <div className="field">
          <label>Approved by <span style={{ color: 'var(--danger)' }}>*</span></label>
          <input value={approvedBy} onChange={(e) => setApprovedBy(e.target.value)} placeholder="Your name" autoFocus />
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn-success" disabled={!approvedBy.trim() || pending} onClick={() => onConfirm(approvedBy.trim())}>
            {pending ? 'Approving…' : 'Approve'}
          </button>
        </div>
      </div>
    </div>
  );
}

function CancelDialog({
  po, onCancel, onConfirm, pending,
}: {
  po: PurchaseOrder;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
  pending: boolean;
}) {
  const [reason, setReason] = useState('');
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--danger-soft)', color: 'var(--danger)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={26} />
          </div>
        </div>
        <h3 className="modal-title" style={{ textAlign: 'center' }}>Cancel this PO?</h3>
        <p className="modal-message" style={{ textAlign: 'center' }}>
          Purchase order <strong>{po.id.slice(0, 8)}</strong> to <strong>{po.supplierName}</strong> will be cancelled.
        </p>
        <div className="field">
          <label>Reason <span style={{ color: 'var(--danger)' }}>*</span></label>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="Why is this PO being cancelled?" autoFocus />
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onCancel}>Keep it</button>
          <button className="btn-danger" disabled={!reason.trim() || pending} onClick={() => onConfirm(reason.trim())}>
            {pending ? 'Cancelling…' : 'Yes, cancel PO'}
          </button>
        </div>
      </div>
    </div>
  );
}
