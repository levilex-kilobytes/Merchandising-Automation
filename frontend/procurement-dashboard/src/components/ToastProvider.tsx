import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';
export type ToastKind = 'success' | 'error' | 'info';
interface T { id: number; message: string; kind: ToastKind }
interface C { push: (m: string, k?: ToastKind) => void }
const Ctx = createContext<C | null>(null);
export function useToast() { const c = useContext(Ctx); if (!c) throw new Error('no provider'); return c; }
let seq = 1;
export function ToastProvider({ children }: { children: ReactNode }) {
  const [t, setT] = useState<T[]>([]);
  const timers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const push = useCallback((m: string, k: ToastKind = 'info') => {
    const id = seq++;
    setT((x) => [...x, { id, message: m, kind: k }]);
    timers.current[id] = setTimeout(() => { setT((x) => x.filter((y) => y.id !== id)); delete timers.current[id]; }, 3200);
  }, []);
  useEffect(() => () => { Object.values(timers.current).forEach(clearTimeout); }, []);
  return <Ctx.Provider value={{ push }}>{children}
    <div className="toast-stack" role="region">{t.map((x) => (
      <div key={x.id} className={`toast toast-${x.kind}`} role="status">
        {x.kind === 'success' ? <CheckCircle2 size={18} /> : x.kind === 'error' ? <AlertTriangle size={18} /> : <Info size={18} />}
        <span>{x.message}</span>
      </div>
    ))}</div>
  </Ctx.Provider>;
}
