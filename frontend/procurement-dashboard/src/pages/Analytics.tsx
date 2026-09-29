import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Clock, CheckCircle2, XCircle, BarChart3 } from 'lucide-react';
import { poApi } from '../api/purchaseOrders';
import { PurchaseOrder } from '../api/types';
import { StatCard } from '../components/StatCard';
import { Bar, Doughnut, Line } from '../components/Charts';

const shortMoney = (n: number, currency = 'KES') =>
  `${currency} ${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
const fullMoney = (n: number, currency = 'KES') =>
  `${currency} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const COLORS = {
  primary: '#0284c7',
  primarySoft: 'rgba(2, 132, 199, 0.75)',
  success: '#16a34a',
  successSoft: 'rgba(22, 163, 74, 0.75)',
  warning: '#ea580c',
  warningSoft: 'rgba(234, 88, 12, 0.75)',
  danger: '#dc2626',
  dangerSoft: 'rgba(220, 38, 38, 0.75)',
  muted: '#94a3b8',
  violet: '#7c3aed',
  violetSoft: 'rgba(124, 58, 237, 0.75)',
};

const STATUS_ORDER: PurchaseOrder['status'][] = [
  'draft', 'pending', 'approved', 'sent', 'received', 'closed', 'cancelled',
];

const STATUS_LABEL: Record<PurchaseOrder['status'], string> = {
  draft: 'Draft',
  pending: 'Pending',
  approved: 'Approved',
  sent: 'Sent',
  received: 'Received',
  closed: 'Closed',
  cancelled: 'Cancelled',
};

const STATUS_COLOR: Record<PurchaseOrder['status'], string> = {
  draft: COLORS.muted,
  pending: COLORS.warning,
  approved: COLORS.success,
  sent: COLORS.primary,
  received: '#0891b2',
  closed: '#64748b',
  cancelled: COLORS.danger,
};

export function Analytics() {
  const { data, isLoading } = useQuery({
    queryKey: ['pos'],
    queryFn: () => poApi.list(),
  });

  const stats = useMemo(() => {
    if (!data) return null;

    const total = data.length;
    const totalValue = data.reduce((s, p) => s + Number(p.totalCost || 0), 0);
    const open = data.filter((p) => ['draft', 'pending', 'approved', 'sent'].includes(p.status)).length;
    const pendingApproval = data.filter((p) => p.status === 'pending').length;
    const cancelled = data.filter((p) => p.status === 'cancelled').length;

    const byStatusMap = new Map<PurchaseOrder['status'], { count: number; value: number }>();
    for (const st of STATUS_ORDER) byStatusMap.set(st, { count: 0, value: 0 });
    for (const p of data) {
      const e = byStatusMap.get(p.status);
      if (e) {
        e.count += 1;
        e.value += Number(p.totalCost || 0);
      }
    }
    const byStatus = STATUS_ORDER
      .map((st) => ({ status: st, ...byStatusMap.get(st)! }))
      .filter((x) => x.count > 0);

    const bySupplierMap = new Map<string, { name: string; count: number; value: number }>();
    for (const p of data) {
      const key = p.supplierName || 'Unknown';
      const e = bySupplierMap.get(key) ?? { name: key, count: 0, value: 0 };
      e.count += 1;
      e.value += Number(p.totalCost || 0);
      bySupplierMap.set(key, e);
    }
    const topSuppliers = Array.from(bySupplierMap.values())
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    const monthlyMap = new Map<string, { count: number; value: number }>();
    for (const p of data) {
      const key = (p.createdAt ?? '').slice(0, 7);
      if (!key) continue;
      const e = monthlyMap.get(key) ?? { count: 0, value: 0 };
      e.count += 1;
      e.value += Number(p.totalCost || 0);
      monthlyMap.set(key, e);
    }
    const monthly = Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, v]) => ({ month, ...v }));

    const receivable = data.filter((p) => ['approved', 'sent'].includes(p.status)).length;
    const expectedValue = data
      .filter((p) => ['approved', 'sent'].includes(p.status))
      .reduce((s, p) => s + Number(p.totalCost || 0), 0);

    return {
      total,
      totalValue,
      open,
      pendingApproval,
      cancelled,
      byStatus,
      topSuppliers,
      monthly,
      receivable,
      expectedValue,
    };
  }, [data]);

  if (isLoading || !stats) return <div className="skeleton skeleton-row" />;

  const hasData = stats.total > 0;

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Procurement Analytics</h2>
          <p>Commitment value, supplier concentration, and monthly trends.</p>
        </div>
      </div>

      <div className="summary">
        <StatCard icon={<FileText size={22} />} label="Total POs" value={stats.total} tone="primary" />
        <StatCard icon={<Clock size={22} />} label="Open / In Flight" value={stats.open} tone="warning" />
        <StatCard icon={<CheckCircle2 size={22} />} label="Committed Value" value={shortMoney(stats.totalValue)} tone="success" />
        <StatCard
          icon={<XCircle size={22} />}
          label="Cancelled"
          value={stats.cancelled}
          tone={stats.cancelled > 0 ? 'danger' : 'success'}
        />
      </div>

      {!hasData && (
        <div className="empty">
          <div className="empty-icon"><BarChart3 size={30} /></div>
          <div className="empty-title">No purchase orders yet</div>
          <div className="empty-hint">Charts populate once POs exist.</div>
        </div>
      )}

      {hasData && (
        <>
          <div className="chart-grid">
            <div className="card chart-card">
              <div className="chart-header">
                <h3>PO value by status</h3>
                <p>Where the committed money sits in the pipeline</p>
              </div>
              <div className="chart-canvas">
                <Bar
                  data={{
                    labels: stats.byStatus.map((x) => STATUS_LABEL[x.status]),
                    datasets: [
                      {
                        label: 'Value',
                        data: stats.byStatus.map((x) => Number(x.value.toFixed(2))),
                        backgroundColor: stats.byStatus.map((x) => STATUS_COLOR[x.status] + 'cc'),
                        borderColor: stats.byStatus.map((x) => STATUS_COLOR[x.status]),
                        borderWidth: 1,
                        borderRadius: 6,
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
                            const i = ctx.dataIndex;
                            const count = stats.byStatus[i]?.count ?? 0;
                            return `${fullMoney(Number(ctx.raw))} · ${count} PO${count === 1 ? '' : 's'}`;
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

            <div className="card chart-card">
              <div className="chart-header">
                <h3>Pipeline composition</h3>
                <p>PO count by status</p>
              </div>
              <div className="chart-canvas">
                <Doughnut
                  data={{
                    labels: stats.byStatus.map((x) => STATUS_LABEL[x.status]),
                    datasets: [
                      {
                        data: stats.byStatus.map((x) => x.count),
                        backgroundColor: stats.byStatus.map((x) => STATUS_COLOR[x.status]),
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
                            const pct = stats.total === 0 ? 0 : Math.round((Number(ctx.raw) / stats.total) * 100);
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

          {stats.monthly.length > 1 && (
            <div className="card chart-card">
              <div className="chart-header">
                <h3>Monthly commitment trend</h3>
                <p>Total value of POs created per month</p>
              </div>
              <div className="chart-canvas" style={{ height: 280 }}>
                <Line
                  data={{
                    labels: stats.monthly.map((m) => m.month),
                    datasets: [
                      {
                        label: 'PO value',
                        data: stats.monthly.map((m) => Number(m.value.toFixed(2))),
                        borderColor: COLORS.primary,
                        backgroundColor: 'rgba(2, 132, 199, 0.12)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.35,
                        pointRadius: 4,
                        pointBackgroundColor: COLORS.primary,
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
                            const i = ctx.dataIndex;
                            const count = stats.monthly[i]?.count ?? 0;
                            return `${fullMoney(Number(ctx.raw))} · ${count} PO${count === 1 ? '' : 's'}`;
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
              <h3>Top suppliers by commitment value</h3>
              <p>Where your spend is concentrated</p>
            </div>
            <div className="chart-canvas" style={{ height: Math.max(240, stats.topSuppliers.length * 44) }}>
              <Bar
                data={{
                  labels: stats.topSuppliers.map((s) => s.name),
                  datasets: [
                    {
                      label: 'Value',
                      data: stats.topSuppliers.map((s) => Number(s.value.toFixed(2))),
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
                        label: (ctx) => {
                          const i = ctx.dataIndex;
                          const count = stats.topSuppliers[i]?.count ?? 0;
                          return `${fullMoney(Number(ctx.raw))} · ${count} PO${count === 1 ? '' : 's'}`;
                        },
                      },
                    },
                  },
                  scales: {
                    x: {
                      ticks: { callback: (v) => shortMoney(Number(v)) },
                      grid: { color: 'rgba(148, 163, 184, 0.15)' },
                    },
                    y: { grid: { display: false } },
                  },
                }}
              />
            </div>
          </div>

          {stats.receivable > 0 && (
            <div className="card" style={{ borderLeft: `4px solid ${COLORS.warning}` }}>
              <div className="chart-header">
                <h3>Awaiting delivery</h3>
                <p>{stats.receivable} purchase order{stats.receivable === 1 ? '' : 's'} approved or sent, waiting to be received</p>
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'SF Mono, Menlo, monospace' }}>
                {fullMoney(stats.expectedValue)}
              </div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
                Expected inventory value on the way
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
