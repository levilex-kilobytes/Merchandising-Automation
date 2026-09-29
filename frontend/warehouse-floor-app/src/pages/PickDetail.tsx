import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, MapPin, ScanLine, Package, Hash, CheckCircle2, AlertTriangle, Truck,
} from 'lucide-react';
import { warehouseApi } from '../api/warehouse';
import { useToast } from '../components/ToastProvider';
import { useScanner } from '../hooks/useScanner';
import { ScannerField } from '../components/ScannerField';
import { TableSkeleton } from '../components/Skeleton';

type Step = 'navigate' | 'scan-bin' | 'scan-item' | 'confirm-qty' | 'done';

const STEP_ORDER: Step[] = ['navigate', 'scan-bin', 'scan-item', 'confirm-qty', 'done'];

export function PickDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { push } = useToast();

  const { data: task, isLoading, error } = useQuery({
    queryKey: ['pick-task', id],
    queryFn: () => warehouseApi.getPickTask(id),
  });

  const [step, setStep] = useState<Step>('navigate');
  const [flash, setFlash] = useState<'success' | 'danger' | null>(null);
  const [qty, setQty] = useState<number>(0);

  useEffect(() => {
    if (task) setQty(task.quantity);
  }, [task]);

  const complete = useMutation({
    mutationFn: () => warehouseApi.completePickTask(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pick-tasks'] });
      push('Pick complete', 'success');
      setStep('done');
      setFlash('success');
      setTimeout(() => navigate('/pick'), 1200);
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : 'Could not complete pick';
      push(msg, 'error');
      setFlash('danger');
    },
  });

  useScanner(
    (code) => {
      if (!task) return;
      if (step === 'scan-bin') {
        if (code.toLowerCase() !== task.fromBin.toLowerCase()) {
          push(`Wrong bin. Expected ${task.fromBin}`, 'error');
          setFlash('danger');
          setTimeout(() => setFlash(null), 450);
          return;
        }
        push(`Bin confirmed`, 'success');
        setFlash('success');
        setTimeout(() => { setFlash(null); setStep('scan-item'); }, 450);
      } else if (step === 'scan-item') {
        if (code.toLowerCase() !== task.productCode.toLowerCase()) {
          push(`Wrong product. Expected ${task.productCode}`, 'error');
          setFlash('danger');
          setTimeout(() => setFlash(null), 450);
          return;
        }
        push(`Product confirmed`, 'success');
        setFlash('success');
        setTimeout(() => { setFlash(null); setStep('confirm-qty'); }, 450);
      }
    },
    step === 'scan-bin' || step === 'scan-item',
  );

  const currentIndex = useMemo(() => STEP_ORDER.indexOf(step), [step]);

  if (isLoading) return <TableSkeleton rows={5} />;
  if (error || !task) {
    return <div className="error-box"><AlertTriangle size={18} /> Task not found.</div>;
  }

  return (
    <>
      <div className="flow-header">
        <div className="flow-header-top">
          <button className="flow-back" onClick={() => navigate('/pick')}>
            <ArrowLeft size={18} /> Back
          </button>
          <span className="flow-sub">{task.productCode}</span>
        </div>
        <div className="flow-title">{task.productName}</div>
        <div className="progress-wrap">
          <div className="progress-label">
            <span>Step {Math.min(currentIndex + 1, 4)} of 4</span>
            <span>{Math.round((currentIndex / 4) * 100)}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${(currentIndex / 4) * 100}%` }} />
          </div>
        </div>

        <ul className="flow-steps">
          {(['navigate', 'scan-bin', 'scan-item', 'confirm-qty'] as Step[]).map((s) => {
            const idx = STEP_ORDER.indexOf(s);
            const state = idx < currentIndex ? 'done' : idx === currentIndex ? 'current' : '';
            const label =
              s === 'navigate' ? 'Go to the source bin'
              : s === 'scan-bin' ? 'Scan the bin barcode'
              : s === 'scan-item' ? 'Scan the product barcode'
              : 'Confirm the quantity';
            return (
              <li key={s} className={state}>
                <span className="step-num">
                  {state === 'done' ? <CheckCircle2 size={14} /> : idx + 1}
                </span>
                {label}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="product-summary">
        <div className="product-summary-item">
          <div className="label">Quantity</div>
          <div className="value">{task.quantity}</div>
        </div>
        <div className="product-summary-item">
          <div className="label">From Bin</div>
          <div className="value mono">{task.fromBin}</div>
        </div>
        <div className="product-summary-item">
          <div className="label">Destination</div>
          <div className="value">{task.toLocation}</div>
        </div>
      </div>

      {step === 'navigate' && (
        <div className="step-panel">
          <MapPin size={44} className="step-panel-icon" />
          <div className="step-panel-title">Go to the source bin</div>
          <div className="step-panel-hint">
            Retrieve {task.quantity} units for {task.toLocation}.
          </div>
          <div className="step-panel-code">{task.fromBin}</div>
          <button
            className="btn-primary btn-lg"
            onClick={() => { setStep('scan-bin'); setFlash('success'); setTimeout(() => setFlash(null), 400); }}
          >
            I'm here
          </button>
        </div>
      )}

      {step === 'scan-bin' && (
        <div className={`step-panel ${flash === 'danger' ? 'danger-flash' : flash === 'success' ? 'success-flash' : ''}`}>
          <ScanLine size={44} className="step-panel-icon" />
          <div className="step-panel-title">Scan the bin barcode</div>
          <div className="step-panel-code">{task.fromBin}</div>
          <ScannerField
            label="Bin code"
            expected={task.fromBin}
            onSubmit={(value) => {
              if (value.toLowerCase() !== task.fromBin.toLowerCase()) {
                push(`Wrong bin. Expected ${task.fromBin}`, 'error');
                setFlash('danger');
                setTimeout(() => setFlash(null), 450);
                return;
              }
              push(`Bin confirmed`, 'success');
              setFlash('success');
              setTimeout(() => { setFlash(null); setStep('scan-item'); }, 400);
            }}
          />
        </div>
      )}

      {step === 'scan-item' && (
        <div className={`step-panel ${flash === 'danger' ? 'danger-flash' : flash === 'success' ? 'success-flash' : ''}`}>
          <Package size={44} className="step-panel-icon" />
          <div className="step-panel-title">Scan the product barcode</div>
          <div className="step-panel-code">{task.productCode}</div>
          <ScannerField
            label="Product code"
            expected={task.productCode}
            onSubmit={(value) => {
              if (value.toLowerCase() !== task.productCode.toLowerCase()) {
                push(`Wrong product. Expected ${task.productCode}`, 'error');
                setFlash('danger');
                setTimeout(() => setFlash(null), 450);
                return;
              }
              push(`Product confirmed`, 'success');
              setFlash('success');
              setTimeout(() => { setFlash(null); setStep('confirm-qty'); }, 400);
            }}
          />
        </div>
      )}

      {step === 'confirm-qty' && (
        <div className={`step-panel ${flash === 'danger' ? 'danger-flash' : ''}`}>
          <Hash size={44} className="step-panel-icon" />
          <div className="step-panel-title">Confirm quantity</div>
          <div className="step-panel-hint">Expected: {task.quantity} units</div>
          <div className="qty-display">{qty}</div>
          <div className="keypad">
            {['1','2','3','4','5','6','7','8','9','⌫','0','C'].map((k) => (
              <button
                key={k}
                onClick={() => {
                  if (k === '⌫') setQty((q) => Math.floor(q / 10));
                  else if (k === 'C') setQty(0);
                  else setQty((q) => Number(`${q}${k}`) || 0);
                }}
              >
                {k}
              </button>
            ))}
          </div>
          <button
            className="btn-success btn-lg"
            disabled={complete.isPending}
            onClick={() => {
              if (qty !== task.quantity) {
                push(`Quantity mismatch (expected ${task.quantity})`, 'error');
                setFlash('danger');
                setTimeout(() => setFlash(null), 450);
                return;
              }
              complete.mutate();
            }}
          >
            {complete.isPending ? 'Completing…' : `Confirm ${qty} units`}
          </button>
        </div>
      )}

      {step === 'done' && (
        <div className="step-panel step-success">
          <Truck size={52} className="step-panel-icon" />
          <div className="step-panel-title">Pick complete</div>
          <div className="step-panel-hint">
            {task.quantity} × {task.productName} → {task.toLocation}.
          </div>
        </div>
      )}
    </>
  );
}
