import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, DollarSign, Award } from 'lucide-react';
import { auditApi } from '../api/audit';
import { StatCard } from '../components/StatCard';

const fmt = (n: number) => `KES ${n.toFixed(2)}`;

export function Analytics() {
  const { data: sessions, isLoading } = useQuery({
    queryKey: ['sessions', { status: '' }],
    queryFn: () => auditApi.listSessions(),
  });

  const stats = useMemo(() => {
    if (!sessions) return null;
    const closed = sessions.filter((s) => s.status === 'closed');
    const overages = closed.filter((s) => s.difference > 0);
    const shortages = closed.filter((s) => s.difference < 0);
    const totalOverage = overages.reduce((sum, s) => sum + s.difference, 0);
    const totalShortage = shortages.reduce((sum, s) => sum + Math.abs(s.difference), 0);
    const net = totalOverage - totalShortage;
    const balanced = closed.filter((s) => s.difference === 0).length;
    const balancedPct = closed.length === 0 ? 0 : Math.round((balanced / closed.length) * 100);

    const byCashier = new Map<string, { name: string; net: number; sessions: number }>();
    for (const s of closed) {
      const key = s.cashierId ?? 'unknown';
      const entry = byCashier.get(key) ?? { name: key, net: 0, sessions: 0 };
      entry.net += s.difference;
      entry.sessions += 1;
      byCashier.set(key, entry);
    }

    return {
      totalSessions: closed.length,
      balancedPct,
      totalOverage,
      totalShortage,
      net,
      cashiers: Array.from(byCashier.values()).sort((a, b) => Math.abs(b.net) - Math.abs(a.net)),
    };
  }, [sessions]);

  if (isLoading || !stats) return <div className="skeleton skeleton-row" />;

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Reconciliation Analytics</h2>
          <p>Patterns across all closed register sessions.</p>
        </div>
      </div>

      <div className="summary">
        <StatCard icon={<Award size={22} />} label="Balanced Sessions" value={`${stats.balancedPct}%`} tone={stats.balancedPct >= 90 ? 'success' : 'warning'} />
        <StatCard icon={<TrendingUp size={22} />} label="Total Overages" value={fmt(stats.totalOverage)} tone="success" />
        <StatCard icon={<TrendingDown size={22} />} label="Total Shortages" value={fmt(stats.totalShortage)} tone="danger" />
        <StatCard icon={<DollarSign size={22} />} label="Net Variance" value={fmt(stats.net)} tone={stats.net === 0 ? 'success' : stats.net < 0 ? 'danger' : 'warning'} />
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 700 }}>Performance by cashier</h3>
        {stats.cashiers.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>No closed sessions yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Cashier</th>
                <th>Sessions</th>
                <th>Net Variance</th>
                <th>Pattern</th>
              </tr>
            </thead>
            <tbody>
              {stats.cashiers.map((c) => (
                <tr key={c.name}>
                  <td><span className="mono">{c.name}</span></td>
                  <td>{c.sessions}</td>
                  <td>
                    <span className={c.net === 0 ? 'diff-zero' : c.net > 0 ? 'diff-positive' : 'diff-negative'}>
                      {c.net > 0 ? '+' : ''}{fmt(c.net)}
                    </span>
                  </td>
                  <td>
                    {c.net === 0 ? (
                      'Consistently balanced'
                    ) : c.net < 0 ? (
                      <span style={{ color: 'var(--danger)' }}>Consistently short</span>
                    ) : (
                      <span style={{ color: 'var(--success)' }}>Consistently over</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
