import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShoppingCart, Receipt, RotateCcw, TrendingUp, BarChart3, CreditCard, Banknote, Gift } from 'lucide-react';
import { retailApi } from '../api/retail';
import { StatCard } from '../components/StatCard';
import { Bar, Doughnut, Line } from '../components/Charts';

const shortMoney = (n: number) => `KES ${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
const fullMoney = (n: number) => `KES ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;


const COLORS = {
  primary: '#0f766e',
  primarySoft: 'rgba(15, 118, 110, 0.75)',
  success: '#16a34a',
  successSoft: 'rgba(22, 163, 74, 0.75)',
  warning: '#ea580c',
  warningSoft: 'rgba(234, 88, 12, 0.75)',
  danger: '#dc2626',
  dangerSoft: 'rgba(220, 38, 38, 0.75)',
  violet: '#7c3aed',
  violetSoft: 'rgba(124, 58, 237, 0.75)',
  sky: '#0284c7',
  skySoft: 'rgba(2, 132, 199, 0.75)',
  muted: '#94a3b8',
};

const PAYMENT_LABEL: Record<string, string> = {
  cash: 'Cash',
  card: 'Card',
  gift_card: 'Gift card',
  mixed: 'Mixed',
};

const PAYMENT_COLOR: Record<string, string> = {
  cash: COLORS.success,
  card: COLORS.sky,
  gift_card: COLORS.violet,
  mixed: COLORS.warning,
};

export function Analytics() {
  const { data: sales, isLoading: loadingSales } = useQuery({
    queryKey: ['sales-enriched'],
    queryFn: () => retailApi.listSalesEnriched(),
  });

  const { data: returns, isLoading: loadingReturns } = useQuery({
    queryKey: ['returns'],
    queryFn: () => retailApi.listReturns(),
  });

  const stats = useMemo(() => {
    if (!sales) return null;

    const completed = sales.filter((s) => s.status === 'completed');
    const voided = sales.filter((s) => s.status === 'voided');

    const grossRevenue = completed.reduce((sum, s) => sum + Number(s.grandTotal || 0), 0);
    const taxCollected = completed.reduce((sum, s) => sum + Number(s.taxTotal || 0), 0);
    const refundTotal = (returns ?? []).reduce((sum, r) => sum + Number(r.refundTotal || 0), 0);
    const netRevenue = grossRevenue - refundTotal;
    const avgTicket = completed.length === 0 ? 0 : grossRevenue / completed.length;

    // Daily revenue — last 14 days
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const dailyMap = new Map<string, { revenue: number; count: number; refunds: number }>();
    for (const s of completed) {
      const date = new Date(s.completedAt ?? s.createdAt);
      if (date < fourteenDaysAgo) continue;
      const key = date.toISOString().slice(0, 10);
      const e = dailyMap.get(key) ?? { revenue: 0, count: 0, refunds: 0 };
      e.revenue += Number(s.grandTotal || 0);
      e.count += 1;
      dailyMap.set(key, e);
    }
    for (const r of returns ?? []) {
      const date = new Date(r.completedAt ?? r.createdAt);
      if (date < fourteenDaysAgo) continue;
      const key = date.toISOString().slice(0, 10);
      const e = dailyMap.get(key) ?? { revenue: 0, count: 0, refunds: 0 };
      e.refunds += Number(r.refundTotal || 0);
      dailyMap.set(key, e);
    }
    const daily = Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, ...v }));

    // Hourly sales — peak hours
    const hourlyMap = new Map<number, { count: number; revenue: number }>();
    for (let h = 0; h < 24; h++) hourlyMap.set(h, { count: 0, revenue: 0 });
    for (const s of completed) {
      const date = new Date(s.completedAt ?? s.createdAt);
      const h = date.getHours();
      const e = hourlyMap.get(h)!;
      e.count += 1;
      e.revenue += Number(s.grandTotal || 0);
    }
    const hourly = Array.from(hourlyMap.entries())
      .map(([hour, v]) => ({ hour, ...v }))
      .filter((h) => h.count > 0);

    // Payment methods
    const paymentMap = new Map<string, { count: number; amount: number }>();
    for (const s of completed) {
      for (const p of s.payments ?? []) {
        const method = String(p.method || 'unknown');
        const e = paymentMap.get(method) ?? { count: 0, amount: 0 };
        e.count += 1;
        e.amount += Number(p.amount || 0);
        paymentMap.set(method, e);
      }
    }
    const paymentMethods = Array.from(paymentMap.entries())
      .map(([method, v]) => ({ method, ...v }))
      .sort((a, b) => b.amount - a.amount);

    // Top sellers
    const productMap = new Map<string, { code: string; name: string; units: number; revenue: number }>();
    for (const s of completed) {
      for (const l of s.lines ?? []) {
        const e = productMap.get(l.productCode) ?? {
          code: l.productCode,
          name: l.productName,
          units: 0,
          revenue: 0,
        };
        e.units += Number(l.quantity || 0);
        e.revenue += Number(l.lineTotal || 0);
        productMap.set(l.productCode, e);
      }
    }
    const topSellers = Array.from(productMap.values())
      .sort((a, b) => b.units - a.units)
      .slice(0, 8);

    return {
      totalSales: sales.length,
      completedCount: completed.length,
      voidedCount: voided.length,
      grossRevenue,
      netRevenue,
      taxCollected,
      refundTotal,
      avgTicket,
      daily,
      hourly,
      paymentMethods,
      topSellers,
      returnsCount: (returns ?? []).length,
    };
  }, [sales, returns]);

  if (loadingSales || loadingReturns || !stats) {
    return <div className="skeleton skeleton-row" />;
  }

  const hasData = stats.completedCount > 0;

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Sales Analytics</h2>
          <p>Revenue trends, payment mix, and top sellers.</p>
        </div>
      </div>

      <div className="summary">
        <StatCard
          icon={<Receipt size={22} />}
          label="Net Revenue"
          value={shortMoney(stats.netRevenue)}
          tone="success"
        />
        <StatCard
          icon={<ShoppingCart size={22} />}
          label="Completed Sales"
          value={stats.completedCount}
          tone="primary"
        />
        <StatCard
          icon={<TrendingUp size={22} />}
          label="Avg Ticket"
          value={shortMoney(stats.avgTicket)}
          tone="primary"
        />
        <StatCard
          icon={<RotateCcw size={22} />}
          label="Refunds"
          value={shortMoney(stats.refundTotal)}
          tone={stats.refundTotal > 0 ? 'danger' : 'success'}
        />
      </div>

      {!hasData && (
        <div className="empty">
          <div className="empty-icon"><BarChart3 size={30} /></div>
          <div className="empty-title">No completed sales yet</div>
          <div className="empty-hint">Charts populate once the terminal processes sales.</div>
        </div>
      )}

      {hasData && (
        <>
          <div className="chart-grid">
            <div className="card chart-card">
              <div className="chart-header">
                <h3>Daily revenue — last 14 days</h3>
                <p>Gross sales and refunds per day</p>
              </div>
              <div className="chart-canvas">
                <Line
                  data={{
                    labels: stats.daily.map((d) => d.date.slice(5)),
                    datasets: [
                      {
                        label: 'Revenue',
                        data: stats.daily.map((d) => Number(d.revenue.toFixed(2))),
                        borderColor: COLORS.primary,
                        backgroundColor: 'rgba(15, 118, 110, 0.15)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.35,
                        pointRadius: 3,
                        pointBackgroundColor: COLORS.primary,
                      },
                      {
                        label: 'Refunds',
                        data: stats.daily.map((d) => Number(d.refunds.toFixed(2))),
                        borderColor: COLORS.danger,
                        backgroundColor: 'rgba(220, 38, 38, 0.10)',
                        borderWidth: 2,
                        tension: 0.35,
                        pointRadius: 3,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'bottom', labels: { boxWidth: 12, padding: 14 } },
                      tooltip: {
                        callbacks: {
                          label: (ctx) => `${ctx.dataset.label}: ${fullMoney(Number(ctx.raw))}`,
                        },
                      },
                    },
                    interaction: { mode: 'index', intersect: false },
                    scales: {
                      x: { grid: { display: false } },
                      y: {
                        beginAtZero: true,
                        ticks: { callback: (v) => shortMoney(Number(v)) },
                        grid: { color: 'rgba(148, 163, 184, 0.15)' },
                      },
                    },
                  }}
                />
              </div>
            </div>

            <div className="card chart-card">
              <div className="chart-header">
                <h3>Payment methods</h3>
                <p>How customers are paying</p>
              </div>
              <div className="chart-canvas">
                <Doughnut
                  data={{
                    labels: stats.paymentMethods.map((m) => PAYMENT_LABEL[m.method] ?? m.method),
                    datasets: [
                      {
                        data: stats.paymentMethods.map((m) => Number(m.amount.toFixed(2))),
                        backgroundColor: stats.paymentMethods.map(
                          (m) => PAYMENT_COLOR[m.method] ?? COLORS.muted,
                        ),
                        borderWidth: 0,
                        hoverOffset: 6,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '62%',
                    plugins: {
                      legend: { position: 'bottom', labels: { boxWidth: 12, padding: 14 } },
                      tooltip: {
                        callbacks: {
                          label: (ctx) => {
                            const total = stats.paymentMethods.reduce((s, m) => s + m.amount, 0);
                            const pct = total === 0 ? 0 : Math.round((Number(ctx.raw) / total) * 100);
                            const m = stats.paymentMethods[ctx.dataIndex];
                            return `${ctx.label}: ${fullMoney(Number(ctx.raw))} (${pct}%) · ${m.count} payment${m.count === 1 ? '' : 's'}`;
                          },
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>

          {stats.hourly.length > 0 && (
            <div className="card chart-card">
              <div className="chart-header">
                <h3>Sales by hour of day</h3>
                <p>When the store is busiest</p>
              </div>
              <div className="chart-canvas" style={{ height: 260 }}>
                <Bar
                  data={{
                    labels: stats.hourly.map((h) => `${String(h.hour).padStart(2, '0')}:00`),
                    datasets: [
                      {
                        label: 'Revenue',
                        data: stats.hourly.map((h) => Number(h.revenue.toFixed(2))),
                        backgroundColor: COLORS.primarySoft,
                        borderColor: COLORS.primary,
                        borderWidth: 1,
                        borderRadius: 4,
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
                            const h = stats.hourly[ctx.dataIndex];
                            return `${fullMoney(Number(ctx.raw))} · ${h.count} sale${h.count === 1 ? '' : 's'}`;
                          },
                        },
                      },
                    },
                    scales: {
                      x: { grid: { display: false } },
                      y: {
                        beginAtZero: true,
                        ticks: { callback: (v) => shortMoney(Number(v)) },
                        grid: { color: 'rgba(148, 163, 184, 0.15)' },
                      },
                    },
                  }}
                />
              </div>
            </div>
          )}

          <div className="card chart-card">
            <div className="chart-header">
              <h3>Top sellers by units</h3>
              <p>The products moving fastest through the till</p>
            </div>
            <div className="chart-canvas" style={{ height: Math.max(260, stats.topSellers.length * 40) }}>
              <Bar
                data={{
                  labels: stats.topSellers.map((s) => s.code),
                  datasets: [
                    {
                      label: 'Units sold',
                      data: stats.topSellers.map((s) => s.units),
                      backgroundColor: COLORS.violetSoft,
                      borderColor: COLORS.violet,
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
                        title: (ctx) => {
                          const i = ctx[0].dataIndex;
                          return stats.topSellers[i]?.name ?? '';
                        },
                        label: (ctx) => {
                          const i = ctx.dataIndex;
                          const s = stats.topSellers[i];
                          return `${s.units} unit${s.units === 1 ? '' : 's'} · ${fullMoney(s.revenue)}`;
                        },
                      },
                    },
                  },
                  scales: {
                    x: {
                      beginAtZero: true,
                      ticks: { callback: (v) => Number(v).toLocaleString() },
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
              <h3>Revenue breakdown</h3>
              <p>Gross sales, refunds, tax, and what's left</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
              <SummaryRow label="Gross revenue" value={fullMoney(stats.grossRevenue)} accent={COLORS.primary} />
              <SummaryRow label="Refunds" value={`− ${fullMoney(stats.refundTotal)}`} accent={COLORS.danger} />
              <SummaryRow label="Tax collected" value={fullMoney(stats.taxCollected)} accent={COLORS.muted} />
              <SummaryRow label="Net revenue" value={fullMoney(stats.netRevenue)} accent={COLORS.success} bold />
            </div>
            <div style={{ marginTop: 16, fontSize: 13, color: 'var(--muted)', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <span><Banknote size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} /> {stats.completedCount} completed</span>
              <span><CreditCard size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} /> {stats.paymentMethods.length} payment types</span>
              <span><Gift size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} /> {stats.returnsCount} return{stats.returnsCount === 1 ? '' : 's'}</span>
              {stats.voidedCount > 0 && (
                <span style={{ color: COLORS.danger }}>{stats.voidedCount} voided sale{stats.voidedCount === 1 ? '' : 's'}</span>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}

function SummaryRow({
  label,
  value,
  accent,
  bold,
}: {
  label: string;
  value: string;
  accent: string;
  bold?: boolean;
}) {
  return (
    <div
      style={{
        borderLeft: `3px solid ${accent}`,
        paddingLeft: 12,
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: 'var(--muted)',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          fontWeight: 700,
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        className="mono"
        style={{
          fontSize: bold ? 22 : 18,
          fontWeight: bold ? 800 : 700,
        }}
      >
        {value}
      </div>
    </div>
  );
}
