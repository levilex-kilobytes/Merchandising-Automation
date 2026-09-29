import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';

export type ToastKind = 'success' | 'error' | 'info';
interface Toast { id: number; message: string; kind: ToastKind }
interface ToastContextValue { push: (message: string, kind?: ToastKind) => void }

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

let seq = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const push = useCallback((message: string, kind: ToastKind = 'info') => {
    const id = seq++;
    setToasts((t) => [...t, { id, message, kind }]);
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      if (kind === 'success') navigator.vibrate?.(60);
      if (kind === 'error') navigator.vibrate?.([80, 40, 80]);
    }
    timers.current[id] = setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
      delete timers.current[id];
    }, 3200);
  }, []);

  useEffect(() => () => { Object.values(timers.current).forEach(clearTimeout); }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="toast-stack" role="region" aria-label="Notifications">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.kind}`} role="status" aria-live="polite">
            {t.kind === 'success' ? <CheckCircle2 size={20} /> : t.kind === 'error' ? <AlertTriangle size={20} /> : <Info size={20} />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
