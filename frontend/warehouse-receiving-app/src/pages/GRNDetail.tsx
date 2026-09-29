import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, AlertTriangle, Package } from 'lucide-react';
import { receivingApi } from '../api/receiving';
import { GRNLine, LineCondition } from '../api/types';
import { useToast } from '../components/ToastProvider';
import { StatCard } from '../components/StatCard';
import { formatDateTime } from '../utils/format';

export function GRNDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { push } = useToast();

  const { data: grn, isLoading, error } = useQuery({
    queryKey: ['grn', id],
    queryFn: () => receivingApi.get(id),
  });

  const [recording, setRecording] = useState<GRNLine | null>(null);

  const complete = useMutation({
    mutationFn: () => receivingApi.complete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['grns'] }); push('GRN completed — event published', 'success'); navigate('/'); },
    onError: (e: unknown) => push(e instanceof Error ? e.message : 'Failed', 'error'),
  });

  if (isLoading) return <div className="skeleton skeleton-row" />;
  if (error || !grn) return <div className="error-box">GRN not found.</div>;

  const recordedCount = grn.lines?.filter((l) => l.receivedQty > 0 || l.damagedQty > 0).length ?? 0;
  const totalLines = grn.lines?.length ?? 0;
  const allRecorded = recordedCount === totalLines && totalLines > 0;

  return <>
    <div className="page-header">
      <div>
        <button className="btn-ghost btn-sm" onClick={() => navigate('/')} style={{ marginBottom: 8 }}><ArrowLeft size={14} /> Back</button>
        <h2>GRN {grn.id.slice(0, 8)}</h2>
        <p>PO {grn.purchaseOrderId.slice(0, 8)} · {grn.supplierName} · <span className={`badge badge-${grn.status}`}>{grn.status}</span></p>
      </div>
    </div>

    <div className="summary">
      <StatCard icon={<Package size={22} />} label="Total Lines" value={totalLines} tone="primary" />
      <StatCard icon={<CheckCircle2 size={22} />} label="Recorded" value={recordedCount} tone="success" />
      <StatCard icon={<AlertTriangle size={22} />} label="Shortages" value={grn.shortages} tone={grn.shortages > 0 ? 'danger' : 'success'} />
      <StatCard icon={<AlertTriangle size={22} />} label="Damages" value={grn.damages} tone={grn.damages > 0 ? 'warning' : 'success'} />
    </div>

    <div className="card">
      <h3 style={{ marginBottom: 12, fontSize: 16, fontWeight: 700 }}>Line items</h3>
      {grn.lines?.length === 0 && <p style={{ color: 'var(--muted)' }}>No lines on this GRN.</p>}
      {grn.lines?.map((line) => {
        const recorded = line.receivedQty > 0 || line.damagedQty > 0;
        return (
          <div key={line.id} className={`line-row ${recorded ? 'recorded' : ''}`}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700 }}>Product</div>
              <div style={{ fontWeight: 600 }}>{line.productName}</div>
              <code style={{ fontSize: 11 }}>{line.productCode}</code>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700 }}>Ordered</div>
              <div className="mono" style={{ fontWeight: 700, fontSize: 18 }}>{line.orderedQty}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700 }}>Received</div>
              <div className="mono" style={{ fontWeight: 700, fontSize: 18, color: line.receivedQty < line.orderedQty && recorded ? 'var(--warning)' : 'var(--text)' }}>{line.receivedQty}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700 }}>Condition</div>
              <span className={`badge badge-${recorded ? line.condition : 'draft'}`}>{recorded ? line.condition : 'not recorded'}</span>
            </div>
            <button
              className={recorded ? 'btn-ghost btn-sm' : 'btn-primary btn-sm'}
              onClick={() => setRecording(line)}
              disabled={grn.status !== 'draft'}
            >
              {recorded ? 'Edit' : 'Record'}
            </button>
          </div>
        );
      })}
    </div>

    {grn.status === 'draft' && (
      <button className="btn-primary btn-lg" onClick={() => complete.mutate()} disabled={!allRecorded || complete.isPending}>
        {complete.isPending ? 'Completing…' : allRecorded ? 'Complete GRN and publish GoodsReceived' : `Record ${totalLines - recordedCount} more line(s) to complete`}
      </button>
    )}

    {grn.status === 'completed' && (
      <div className="card" style={{ borderColor: 'var(--success)', background: 'var(--success-soft)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <CheckCircle2 size={22} style={{ color: 'var(--success)' }} />
          <div>
            <div style={{ fontWeight: 700 }}>GRN completed</div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>GoodsReceived event published on {grn.completedAt ? formatDateTime(grn.completedAt) : '—'}</div>
          </div>
        </div>
      </div>
    )}

    {recording && (
      <RecordLineModal
        line={recording}
        onClose={() => setRecording(null)}
        onSaved={() => { setRecording(null); qc.invalidateQueries({ queryKey: ['grn', id] }); qc.invalidateQueries({ queryKey: ['grns'] }); push('Line recorded', 'success'); }}
      />
    )}
  </>;
}

function RecordLineModal({ line, onClose, onSaved }: { line: GRNLine; onClose: () => void; onSaved: () => void }) {
  const [receivedQty, setReceivedQty] = useState(line.receivedQty || line.orderedQty);
  const [damagedQty, setDamagedQty] = useState(line.damagedQty);
  const [condition, setCondition] = useState<LineCondition>(line.condition);
  const [notes, setNotes] = useState(line.notes ?? '');
  const { push } = useToast();

  const save = useMutation({
    mutationFn: () => receivingApi.recordLine(line.goodsReceivedNoteId, { productCode: line.productCode, receivedQty, damagedQty, condition, notes: notes || undefined }),
    onSuccess: onSaved,
    onError: (e: unknown) => push(e instanceof Error ? e.message : 'Failed', 'error'),
  });

  const shortage = line.orderedQty - receivedQty;
  const overage = receivedQty - line.orderedQty;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">Record received line</h3>
        <p className="modal-message">{line.productName} · ordered {line.orderedQty}</p>

        <div className="field">
          <label>Received quantity</label>
          <input type="number" min={0} value={receivedQty} onChange={(e) => setReceivedQty(Number(e.target.value) || 0)} className="mono" style={{ fontSize: 20, textAlign: 'center', fontWeight: 700 }} />
        </div>

        <div className="field">
          <label>Damaged quantity</label>
          <input type="number" min={0} value={damagedQty} onChange={(e) => setDamagedQty(Number(e.target.value) || 0)} className="mono" />
        </div>

        <div className="field">
          <label>Condition</label>
          <select value={condition} onChange={(e) => setCondition(e.target.value as LineCondition)}>
            <option value="good">Good</option>
            <option value="damaged">Damaged</option>
            <option value="quarantined">Quarantined</option>
          </select>
        </div>

        <div className="field">
          <label>Notes (optional)</label>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. 3 boxes crushed on corner" />
        </div>

        {(shortage !== 0 || overage > 0) && (
          <div className="error-box" style={{ marginBottom: 0 }}>
            <AlertTriangle size={16} />
            {shortage > 0 ? `Shortage of ${shortage} units will be flagged on the GRN.` : `Overage of ${overage} units will be flagged on the GRN.`}
          </div>
        )}

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={save.isPending} onClick={() => save.mutate()}>
            {save.isPending ? 'Saving…' : 'Save line'}
          </button>
        </div>
      </div>
    </div>
  );
}
