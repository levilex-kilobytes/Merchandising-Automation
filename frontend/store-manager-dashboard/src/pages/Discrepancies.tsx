import { useQuery } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import { auditApi } from '../api/audit';
import { formatISODate } from '../utils/format';

const fmt = (n: number) => `KES ${Math.abs(n).toFixed(2)}`;

export function Discrepancies() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['discrepancies'],
    queryFn: () => auditApi.listDiscrepancies(),
  });

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Discrepancy Log</h2>
          <p>Every register session with an overage or shortage.</p>
        </div>
      </div>

      {isLoading && <div className="skeleton skeleton-row" />}
      {error && <div className="error-box">Failed to load discrepancies.</div>}

      {data && data.length === 0 && (
        <div className="empty">
          <div className="empty-icon"><AlertTriangle size={30} /></div>
          <div className="empty-title">No discrepancies</div>
          <div className="empty-hint">Every counted register has balanced so far.</div>
        </div>
      )}

      {data && data.length > 0 && data.map((s) => {
        const isShortage = s.difference < 0;
        return (
          <div key={s.id} className={`discrepancy-card ${isShortage ? 'shortage' : 'overage'}`}>
            <div className="discrepancy-head">
              <div>
                <div className="discrepancy-register">{s.registerCode}</div>
                <div className="discrepancy-meta">
                  {s.storeLocation} · {formatISODate(s.businessDate)} · {s.cashierId ?? 'unknown cashier'}
                </div>
              </div>
              <div className={`discrepancy-diff ${isShortage ? 'diff-negative' : 'diff-positive'}`}>
                {isShortage ? '−' : '+'}{fmt(s.difference)}
              </div>
            </div>
            <div className="discrepancy-meta">
              Expected {fmt(s.expectedTotal)} · Counted {fmt(s.countedTotal)}
            </div>
          </div>
        );
      })}
    </>
  );
}
