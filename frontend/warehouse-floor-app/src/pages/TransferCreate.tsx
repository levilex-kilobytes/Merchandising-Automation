import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Trash2, Send, AlertTriangle } from 'lucide-react';
import { warehouseApi } from '../api/warehouse';
import { useToast } from '../components/ToastProvider';
import { CreateTransferDto } from '../api/types';

interface LineDraft {
  key: string;
  productCode: string;
  productName: string;
  quantity: number;
}

const newLine = (): LineDraft => ({
  key: crypto.randomUUID(),
  productCode: '',
  productName: '',
  quantity: 1,
});

export function TransferCreate() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { push } = useToast();

  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<LineDraft[]>([newLine()]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: locations } = useQuery({
    queryKey: ['locations', { zone: '' }],
    queryFn: () => warehouseApi.listLocations(),
  });

  const knownLocations = useMemo(() => {
    if (!locations) return { warehouses: [], stores: [] };
    const warehouses = Array.from(new Set(locations.map((l) => `Warehouse ${l.zone}`)));
    const stores = ['Store #1', 'Store #2', 'Store #3', 'Store #4'];
    return { warehouses, stores };
  }, [locations]);

  const create = useMutation({
    mutationFn: (dto: CreateTransferDto) => warehouseApi.createTransfer(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transfers'] });
      push('Transfer created', 'success');
      navigate('/transfers');
    },
    onError: (e: unknown) =>
      push(e instanceof Error ? e.message : 'Could not create transfer', 'error'),
  });

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!fromLocation.trim()) next.fromLocation = 'Source is required';
    if (!toLocation.trim()) next.toLocation = 'Destination is required';
    if (fromLocation.trim() && fromLocation.trim() === toLocation.trim())
      next.toLocation = 'Source and destination must differ';
    if (lines.length === 0) next.lines = 'At least one item is required';
    lines.forEach((l, i) => {
      if (!l.productCode.trim()) next[`line-${i}-code`] = 'SKU required';
      if (l.quantity <= 0) next[`line-${i}-qty`] = 'Must be > 0';
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      push('Please fix the errors below', 'error');
      return;
    }
    create.mutate({
      fromLocation: fromLocation.trim(),
      toLocation: toLocation.trim(),
      notes: notes.trim() || undefined,
      lines: lines.map(({ productCode, productName, quantity }) => ({
        productCode: productCode.trim(),
        productName: productName.trim() || productCode.trim(),
        quantity,
      })),
    });
  };

  const updateLine = (key: string, patch: Partial<LineDraft>) =>
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  const removeLine = (key: string) =>
    setLines((prev) => (prev.length === 1 ? prev : prev.filter((l) => l.key !== key)));

  const totalUnits = lines.reduce((sum, l) => sum + (l.quantity || 0), 0);

  return (
    <form onSubmit={submit}>
      <div className="flow-header">
        <div className="flow-header-top">
          <button type="button" className="flow-back" onClick={() => navigate('/transfers')}>
            <ArrowLeft size={18} /> Back
          </button>
        </div>
        <div className="flow-title">New Stock Transfer</div>
        <div className="progress-label" style={{ marginTop: 4 }}>
          <span>Move stock between warehouse and store locations</span>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 16, fontSize: 15, fontWeight: 700 }}>Route</h3>

        <div className="field">
          <label htmlFor="from">From</label>
          <input
            id="from"
            value={fromLocation}
            onChange={(e) => setFromLocation(e.target.value)}
            placeholder="e.g. Warehouse A"
            autoComplete="off"
          />
          <div className="quick-picks">
            {knownLocations.warehouses.map((w) => (
              <button
                key={w} type="button"
                className={`chip ${fromLocation === w ? 'active' : ''}`}
                onClick={() => setFromLocation(w)}
              >
                {w}
              </button>
            ))}
          </div>
          {errors.fromLocation && <div className="field-error">{errors.fromLocation}</div>}
        </div>

        <div className="field">
          <label htmlFor="to">To</label>
          <input
            id="to"
            value={toLocation}
            onChange={(e) => setToLocation(e.target.value)}
            placeholder="e.g. Store #3"
            autoComplete="off"
          />
          <div className="quick-picks">
            {knownLocations.stores.map((s) => (
              <button
                key={s} type="button"
                className={`chip ${toLocation === s ? 'active' : ''}`}
                onClick={() => setToLocation(s)}
              >
                {s}
              </button>
            ))}
          </div>
          {errors.toLocation && <div className="field-error">{errors.toLocation}</div>}
        </div>

        <div className="field">
          <label htmlFor="notes">Notes (optional)</label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Delivery window, courier, special instructions…"
            rows={2}
          />
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700 }}>Items</h3>
          <span style={{ color: 'var(--muted)', fontSize: 13 }}>
            {lines.length} line{lines.length > 1 ? 's' : ''} · {totalUnits} units total
          </span>
        </div>

        {errors.lines && <div className="field-error" style={{ marginBottom: 12 }}>{errors.lines}</div>}

        <div className="line-items">
          {lines.map((line, i) => (
            <div key={line.key} className="line-item">
              <div className="line-item-row">
                <div className="field" style={{ flex: 2, marginBottom: 0 }}>
                  <label htmlFor={`code-${line.key}`}>SKU</label>
                  <input
                    id={`code-${line.key}`}
                    value={line.productCode}
                    onChange={(e) => updateLine(line.key, { productCode: e.target.value })}
                    placeholder="SKU-1001"
                    autoComplete="off"
                    style={{ fontFamily: 'SF Mono, Menlo, monospace' }}
                  />
                  {errors[`line-${i}-code`] && (
                    <div className="field-error">{errors[`line-${i}-code`]}</div>
                  )}
                </div>

                <div className="field" style={{ flex: 2, marginBottom: 0 }}>
                  <label htmlFor={`name-${line.key}`}>Name</label>
                  <input
                    id={`name-${line.key}`}
                    value={line.productName}
                    onChange={(e) => updateLine(line.key, { productName: e.target.value })}
                    placeholder="Wireless Mouse"
                    autoComplete="off"
                  />
                </div>

                <div className="field" style={{ flex: 1, marginBottom: 0 }}>
                  <label htmlFor={`qty-${line.key}`}>Qty</label>
                  <input
                    id={`qty-${line.key}`}
                    type="number"
                    min={1}
                    value={line.quantity}
                    onChange={(e) => updateLine(line.key, { quantity: Number(e.target.value) || 0 })}
                  />
                  {errors[`line-${i}-qty`] && (
                    <div className="field-error">{errors[`line-${i}-qty`]}</div>
                  )}
                </div>

                <button
                  type="button"
                  className="btn-ghost btn-sm line-remove"
                  onClick={() => removeLine(line.key)}
                  disabled={lines.length === 1}
                  aria-label="Remove line"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="btn-secondary"
          onClick={() => setLines((prev) => [...prev, newLine()])}
          style={{ marginTop: 12 }}
        >
          <Plus size={16} /> Add item
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => navigate('/transfers')}
          style={{ flex: 1 }}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn-primary"
          disabled={create.isPending}
          style={{ flex: 2 }}
        >
          <Send size={16} />
          {create.isPending ? 'Creating…' : 'Create transfer'}
        </button>
      </div>

      {create.error instanceof Error && (
        <div className="error-box" style={{ marginTop: 16 }}>
          <AlertTriangle size={16} /> {create.error.message}
        </div>
      )}
    </form>
  );
}
