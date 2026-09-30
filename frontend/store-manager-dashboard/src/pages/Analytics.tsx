import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, DollarSign, Award, BarChart3 } from 'lucide-react';
import { auditApi } from '../api/audit';
import { StatCard } from '../components/StatCard';
import { Bar, Doughnut, Line } from '../components/Charts';

const fmt = (n: number) => `KES ${n.toFixed(2)}`;
const shortFmt = (n: number) => `KES ${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

const CHART_COLORS = {
  success: '#16a34a',
  successSoft: 'rgba(22, 163, 74, 0.75)',
  danger: '#dc2626',
  dangerSoft: 'rgba(220, 38, 38, 0.75)',
  primary: '#0d9488',
  primarySoft: 'rgba(13, 148, 136, 0.75)',
  warning: '#ea580c',
  muted: '#94a3b8',
};

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

    const byDateMap = new Map<string, { overages: number; shortages: number; net: number; count: number }>();
    for (const s of closed) {
      const entry = byDateMap.get(s.businessDate) ?? { overages: 0, shortages: 0, net: 0, count: 0 };
      if (s.difference > 0) entry.overages += s.difference;
      if (s.difference < 0) entry.shortages += Math.abs(s.difference);
      entry.net += s.difference;
      entry.count += 1;
      byDateMap.set(s.businessDate, entry);
    }
    const daily = Array.from(byDateMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, ...v }));

    const byCashierMap = new Map<string, { name: string; net: number; sessions: number; shortages: number; overages: number }>();
    for (const s of closed) {
      const key = s.cashierId ?? 'unassigned';
      const entry = byCashierMap.get(key) ?? { name: key, net: 0, sessions: 0, shortages: 0, overages: 0 };
      entry.net += s.difference;
      entry.sessions += 1;
      if (s.difference < 0) entry.shortages += Math.abs(s.difference);
      if (s.difference > 0) entry.overages += s.difference;
      byCashierMap.set(key, entry);
    }
    const cashiers = Array.from(byCashierMap.values()).sort((a, b) => Math.abs(b.net) - Math.abs(a.net));

    return {
      totalSessions: closed.length,
      balancedPct,
      totalOverage,
      totalShortage,
      net,
      cashiers,
      daily,
      statusBreakdown: {
        balanced,
        overage: overages.length,
        shortage: shortages.length,
      },
    };
  }, [sessions]);

  if (isLoading || !stats) return <div className="skeleton skeleton-row" />;

  const hasClosed = stats.totalSessions > 0;

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
        <StatCard icon={<TrendingUp size={22} />} label="Total Overages" value={shortFmt(stats.totalOverage)} tone="success" />
        <StatCard icon={<TrendingDown size={22} />} label="Total Shortages" value={shortFmt(stats.totalShortage)} tone="danger" />
        <StatCard icon={<DollarSign size={22} />} label="Net Variance" value={shortFmt(stats.net)} tone={stats.net === 0 ? 'success' : stats.net < 0 ? 'danger' : 'warning'} />
      </div>

      {!hasClosed && (
        <div className="empty">
          <div className="empty-icon"><BarChart3 size={30} /></div>
          <div className="empty-title">No closed sessions yet</div>
          <div className="empty-hint">Charts will populate once you close register sessions.</div>
        </div>
      )}

      {hasClosed && (
        <>
          <div className="chart-grid">
            <div className="card chart-card">
              <div className="chart-header">
                <h3>Daily overages vs shortages</h3>
                <p>Cash variance by business date</p>
              </div>
              <div className="chart-canvas">
                <Bar
                  data={{
                    labels: stats.daily.map((d) => d.date.slice(5)),
                    datasets: [
                      {
                        label: 'Overages',
                        data: stats.daily.map((d) => Number(d.overages.toFixed(2))),
                        backgroundColor: CHART_COLORS.successSoft,
                        borderColor: CHART_COLORS.success,
                        borderWidth: 1,
                        borderRadius: 4,
                      },
                      {
                        label: 'Shortages',
                        data: stats.daily.map((d) => Number(d.shortages.toFixed(2))),
                        backgroundColor: CHART_COLORS.dangerSoft,
                        borderColor: CHART_COLORS.danger,
                        borderWidth: 1,
                        borderRadius: 4,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'bottom', labels: { boxWidth: 12, padding: 16 } },
                      tooltip: {
                        callbacks: {
                          label: (ctx) => `${ctx.dataset.label}: ${fmt(Number(ctx.raw))}`,
                        },
                      },
                    },
                    scales: {
                      x: { grid: { display: false } },
                      y: {
                        beginAtZero: true,
                        ticks: { callback: (v) => shortFmt(Number(v)) },
                        grid: { color: 'rgba(148, 163, 184, 0.15)' },
                      },
                    },
                  }}
                />
              </div>
            </div>

            <div className="card chart-card">
              <div className="chart-header">
                <h3>Session outcomes</h3>
                <p>Balanced vs discrepancies</p>
              </div>
              <div className="chart-canvas">
                <Doughnut
                  data={{
                    labels: ['Balanced', 'Overage', 'Shortage'],
                    datasets: [
                      {
                        data: [stats.statusBreakdown.balanced, stats.statusBreakdown.overage, stats.statusBreakdown.shortage],
                        backgroundColor: [CHART_COLORS.success, CHART_COLORS.primary, CHART_COLORS.danger],
                        borderWidth: 0,
                        hoverOffset: 6,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '65%',
                    plugins: {
                      legend: { position: 'bottom', labels: { boxWidth: 12, padding: 14 } },
                      tooltip: {
                        callbacks: {
                          label: (ctx) => {
                            const total = stats.statusBreakdown.balanced + stats.statusBreakdown.overage + stats.statusBreakdown.shortage;
                            const pct = total === 0 ? 0 : Math.round((Number(ctx.raw) / total) * 100);
                            return `${ctx.label}: ${ctx.raw} (${pct}%)`;
                          },
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>

          <div className="card chart-card">
            <div className="chart-header">
              <h3>Net variance trend</h3>
              <p>Running total of overages minus shortages across days</p>
            </div>
            <div className="chart-canvas" style={{ height: 240 }}>
              <Line
                data={{
                  labels: stats.daily.map((d) => d.date.slice(5)),
                  datasets: [
                    {
                      label: 'Daily net',
                      data: stats.daily.map((d) => Number(d.net.toFixed(2))),
                      borderColor: CHART_COLORS.primary,
                      backgroundColor: 'rgba(13, 148, 136, 0.12)',
                      borderWidth: 2,
                      fill: true,
                      tension: 0.35,
                      pointRadius: 4,
                      pointBackgroundColor: CHART_COLORS.primary,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      callbacks: {
                        label: (ctx) => {
                          const v = Number(ctx.raw);
                          return `${v >= 0 ? '+' : ''}${fmt(v)}`;
                        },
                      },
                    },
                  },
                  scales: {
                    x: { grid: { display: false } },
                    y: {
                      ticks: { callback: (v) => shortFmt(Number(v)) },
                      grid: { color: 'rgba(148, 163, 184, 0.15)' },
                    },
                  },
                }}
              />
            </div>
          </div>

          <div className="card chart-card">
            <div className="chart-header">
              <h3>Variance by cashier</h3>
              <p>Positive means overage, negative means shortage</p>
            </div>
            <div className="chart-canvas" style={{ height: Math.max(200, stats.cashiers.length * 44) }}>
              <Bar
                data={{
                  labels: stats.cashiers.map((c) => c.name),
                  datasets: [
                    {
                      label: 'Net variance',
                      data: stats.cashiers.map((c) => Number(c.net.toFixed(2))),
                      backgroundColor: stats.cashiers.map((c) =>
                        c.net > 0 ? CHART_COLORS.successSoft : c.net < 0 ? CHART_COLORS.dangerSoft : CHART_COLORS.muted,
                      ),
                      borderColor: stats.cashiers.map((c) =>
                        c.net > 0 ? CHART_COLORS.success : c.net < 0 ? CHART_COLORS.danger : CHART_COLORS.muted,
                      ),
                      borderWidth: 1,
                      borderRadius: 4,
                    },
                  ],
                }}
                options={{
                  indexAxis: 'y' as const,
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      callbacks: {
                        label: (ctx) => {
                          const v = Number(ctx.raw);
                          return `${v >= 0 ? '+' : ''}${fmt(v)}`;
                        },
                      },
                    },
                  },
                  scales: {
                    x: {
                      ticks: { callback: (v) => shortFmt(Number(v)) },
                      grid: { color: 'rgba(148, 163, 184, 0.15)' },
                    },
                    y: { grid: { display: false } },
                  },
                }}
              />
            </div>
          </div>

          <div className="card">
            <div className="chart-header">
              <h3>Performance by cashier — details</h3>
              <p>Per-cashier breakdown across all closed sessions</p>
            </div>
            {stats.cashiers.length === 0 ? (
              <p style={{ color: 'var(--muted)', fontSize: 14 }}>No closed sessions yet.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Cashier</th>
                    <th className="num">Sessions</th>
                    <th className="num">Net Variance</th>
                    <th>Pattern</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.cashiers.map((c) => (
                    <tr key={c.name}>
                      <td><span className="mono">{c.name}</span></td>
                      <td className="num">{c.sessions}</td>
                      <td className="num">
                        <span className={c.net === 0 ? 'diff-zero' : c.net > 0 ? 'diff-positive' : 'diff-negative'}>
                          {c.net > 0 ? '+' : ''}{fmt(c.net)}
                        </span>
                      </td>
                      <td>
                        {c.net === 0
                          ? 'Consistently balanced'
                          : c.net < 0
                            ? <span style={{ color: 'var(--danger)' }}>Net short across {c.sessions} session{c.sessions > 1 ? 's' : ''}</span>
                            : <span style={{ color: 'var(--success)' }}>Net over across {c.sessions} session{c.sessions > 1 ? 's' : ''}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </>
  );
}
