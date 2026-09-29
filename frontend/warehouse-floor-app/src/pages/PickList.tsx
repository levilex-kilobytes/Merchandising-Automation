import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ShoppingCart, CheckCircle2, Clock, ArrowRight, PackageOpen, Plus, AlertTriangle, X } from 'lucide-react';
import { warehouseApi } from '../api/warehouse';
import { useToast } from '../components/ToastProvider';
import { StatCard } from '../components/StatCard';
import { formatDateTime, formatDate } from '../utils/format';

type Tab = 'pending' | 'completed' | 'all';

export function PickList() {
  const [tab, setTab] = useState<Tab>('pending');

  const [createOpen, setCreateOpen] = useState(false);
  const { push } = useToast();
  const qc = useQueryClient();

  const { data: allTasks, isLoading, error } = useQuery({
    queryKey: ['pick-tasks'],
    queryFn: () => warehouseApi.listPickTasks(),
  });

  const tasks = allTasks ?? [];

  const counts = useMemo(() => ({
    pending: tasks.filter((t) => t.status === 'pending').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
    total: tasks.length,
  }), [tasks]);

  const visible = useMemo(() => {
    if (tab === 'all') return tasks;
    return tasks.filter((t) => t.status === tab);
  }, [tasks, tab]);

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Pick Tasks</h2>
          <p>Retrieve items from bins for store transfers and orders.</p>
        </div>
        <button className="btn-primary" onClick={() => setCreateOpen(true)}>
          <Plus size={16} /> New pick task
        </button>
      </div>

      <div className="summary">
        <StatCard icon={<Clock size={22} />} label="Pending" value={counts.pending} tone="warning" />
        <StatCard icon={<CheckCircle2 size={22} />} label="Completed" value={counts.completed} tone="success" />
        <StatCard icon={<ShoppingCart size={22} />} label="Total" value={counts.total} tone="primary" />
      </div>

      <div className="filters">
        {(['pending', 'completed', 'all'] as Tab[]).map((t) => (
          <button
            key={t}
            className={`chip ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'pending' ? 'Pending' : t === 'completed' ? 'Completed' : 'All'}
            <span style={{ marginLeft: 6, opacity: 0.7 }}>
              {t === 'pending' ? counts.pending : t === 'completed' ? counts.completed : counts.total}
            </span>
          </button>
        ))}
      </div>

      {isLoading && <div className="skeleton skeleton-row" />}
      {error && (
        <div className="error-box">
          Failed to load pick tasks: {error instanceof Error ? error.message : 'unknown'}
        </div>
      )}

      {!isLoading && visible.length === 0 && (
        <div className="empty">
          <div className="empty-icon"><PackageOpen size={30} /></div>
          <div className="empty-title">
            {tab === 'completed' ? 'No completed picks yet' : tab === 'pending' ? 'No pending picks' : 'No picks'}
          </div>
          <div className="empty-hint">
            {tab === 'pending'
              ? 'Pick tasks are created when a store transfer is dispatched.'
              : tab === 'completed'
                ? 'Completed picks will show here.'
                : 'Pick tasks will appear here.'}
          </div>
        </div>
      )}

      {visible.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th className="num">Qty</th>
              <th>From Bin</th>
              <th>Destination</th>
              <th>Status</th>
              <th>Completed</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((task) => (
              <tr key={task.id}>
                <td>
                  <div className="cell-product">
                    <strong>{task.productName}</strong>
                    <code>{task.productCode}</code>
                  </div>
                </td>
                <td className="num"><span className="cell-qty">{task.quantity}</span></td>
                <td><span className="cell-bin"><code>{task.fromBin}</code></span></td>
                <td>{task.toLocation}</td>
                <td>
                  <span className={`badge badge-${task.status === 'completed' ? 'completed' : 'pending'}`}>
                    {task.status === 'completed' ? 'Completed' : 'Pending'}
                  </span>
                </td>
                <td style={{ fontSize: 13, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                  {task.completedAt ? formatDateTime(task.completedAt) : '—'}
                </td>
                <td>
                  {task.status === 'pending' ? (
                    <Link to={`/pick/${task.id}`} className="btn-primary btn-sm">
                      Start <ArrowRight size={14} />
                    </Link>
                  ) : (
                    <span style={{ fontSize: 13, color: 'var(--success)', fontWeight: 600 }}>✓ Done</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {createOpen && (
        <CreatePickModal
          onClose={() => setCreateOpen(false)}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ['pick-tasks'] });
            setCreateOpen(false);
          }}
        />
      )}
    </>
  );
}


function CreatePickModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { push } = useToast();
  const [productCode, setProductCode] = useState('');
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [fromBin, setFromBin] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const create = useMutation({
    mutationFn: () =>
      warehouseApi.createPickTask({
        productCode: productCode.trim(),
        productName: productName.trim() || productCode.trim(),
        quantity,
        fromBin: fromBin.trim(),
        toLocation: toLocation.trim(),
      }),
    onSuccess: () => {
      push('Pick task created', 'success');
      onSuccess();
    },
    onError: (e: unknown) => push(e instanceof Error ? e.message : 'Failed to create task', 'error'),
  });

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!productCode.trim()) e.productCode = 'Product code is required';
    if (!fromBin.trim()) e.fromBin = 'Source bin is required';
    if (!toLocation.trim()) e.toLocation = 'Destination is required';
    if (quantity <= 0) e.quantity = 'Must be greater than zero';
    else if (!Number.isInteger(quantity)) e.quantity = 'Whole number only';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
          <h3 className="modal-title">New pick task</h3>
          <button className="btn-ghost btn-sm" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </div>
        <p className="modal-message">
          Create a task telling a picker to retrieve stock from a bin and move it somewhere.
        </p>

        <div className={`field ${errors.productCode ? 'has-error' : ''}`}>
          <label>Product code <span style={{ color: 'var(--danger)' }}>*</span></label>
          <input
            value={productCode}
            onChange={(e) => {
              setProductCode(e.target.value);
              setErrors((p) => { const n = { ...p }; delete n.productCode; return n; });
            }}
            placeholder="PROD-X"
            className={`mono ${errors.productCode ? 'input-error' : ''}`}
            autoFocus
          />
          {errors.productCode && <div className="field-error"><AlertTriangle size={12} /> {errors.productCode}</div>}
        </div>

        <div className="field">
          <label>Product name (optional)</label>
          <input
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="Widget X — leave blank to use the code"
          />
        </div>

        <div className={`field ${errors.quantity ? 'has-error' : ''}`}>
          <label>Quantity <span style={{ color: 'var(--danger)' }}>*</span></label>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => {
              setQuantity(Number(e.target.value) || 0);
              setErrors((p) => { const n = { ...p }; delete n.quantity; return n; });
            }}
            className={errors.quantity ? 'input-error' : ''}
          />
          {errors.quantity && <div className="field-error"><AlertTriangle size={12} /> {errors.quantity}</div>}
        </div>

        <div className={`field ${errors.fromBin ? 'has-error' : ''}`}>
          <label>From bin <span style={{ color: 'var(--danger)' }}>*</span></label>
          <input
            value={fromBin}
            onChange={(e) => {
              setFromBin(e.target.value);
              setErrors((p) => { const n = { ...p }; delete n.fromBin; return n; });
            }}
            placeholder="A-01-01-A"
            className={`mono ${errors.fromBin ? 'input-error' : ''}`}
          />
          {errors.fromBin && <div className="field-error"><AlertTriangle size={12} /> {errors.fromBin}</div>}
        </div>

        <div className={`field ${errors.toLocation ? 'has-error' : ''}`}>
          <label>Destination <span style={{ color: 'var(--danger)' }}>*</span></label>
          <input
            value={toLocation}
            onChange={(e) => {
              setToLocation(e.target.value);
              setErrors((p) => { const n = { ...p }; delete n.toLocation; return n; });
            }}
            placeholder="Store #3"
            className={errors.toLocation ? 'input-error' : ''}
          />
          {errors.toLocation && <div className="field-error"><AlertTriangle size={12} /> {errors.toLocation}</div>}
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn-primary"
            disabled={create.isPending}
            onClick={() => { if (validate()) create.mutate(); }}
          >
            {create.isPending ? 'Creating…' : 'Create task'}
          </button>
        </div>
      </div>
    </div>
  );
}
