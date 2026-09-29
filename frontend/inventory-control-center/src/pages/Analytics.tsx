import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Coins, Package, MapPin, AlertTriangle, BarChart3 } from 'lucide-react';
import { inventoryApi } from '../api/inventory';
import { StockItem, StockMovement } from '../api/types';
import { StatCard } from '../components/StatCard';
import { Bar, Doughnut, Line } from '../components/Charts';
import { formatDateTime, formatDate } from '../utils/format';

const shortMoney = (n: number) =>
  `KES ${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
const fullMoney = (n: number) =>
  `KES ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const COLORS = {
  primary: '#0d9488',
  primarySoft: 'rgba(13, 148, 136, 0.75)',
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

const SLICE_PALETTE = [
  COLORS.primary,
  COLORS.sky,
  COLORS.violet,
  COLORS.warning,
  COLORS.success,
  '#db2777',
  '#0891b2',
  '#65a30d',
  '#9333ea',
  '#e11d48',
];

export function Analytics() {
  const { data: items, isLoading: loadingStock } = useQuery({
    queryKey: ['stock', { location: '', lowOnly: false }],
    queryFn: () => inventoryApi.listStock(),
  });

  const { data: movements, isLoading: loadingMovements } = useQuery({
    queryKey: ['movements', { location: '' }],
    queryFn: () => inventoryApi.listMovements().catch(() => []),
  });

  const stats = useMemo(() => {
    if (!items) return null;

    const totalValuation = items.reduce((s, i) => s + i.valuation, 0);
    const totalUnits = items.reduce((s, i) => s + i.onHand, 0);
    const totalSkus = new Set(items.map((i) => i.productCode)).size;
    const lowCount = items.filter((i) => i.available <= i.lowStockThreshold).length;
    const outCount = items.filter((i) => i.available <= 0).length;

    const byLocation = new Map<string, number>();
    for (const i of items) {
      byLocation.set(i.locationCode, (byLocation.get(i.locationCode) ?? 0) + i.valuation);
    }
    const locationValuation = Array.from(byLocation.entries())
      .map(([location, value]) => ({ location, value }))
      .sort((a, b) => b.value - a.value);

    const topSkus = [...items]
      .sort((a, b) => b.valuation - a.valuation)
      .slice(0, 10)
      .map((i) => ({ code: i.productCode, name: i.productName, value: i.valuation, location: i.locationCode }));

    const health = {
      healthy: items.filter((i) => i.available > i.lowStockThreshold).length,
      low: lowCount - outCount,
      out: outCount,
    };

    const dailyMap = new Map<string, { received: number; sold: number; returned: number; adjusted: number; transferred: number }>();
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    for (const m of movements ?? []) {
      const date = new Date(m.createdAt);
      if (date < fourteenDaysAgo) continue;
      const key = date.toISOString().slice(0, 10);
      const entry = dailyMap.get(key) ?? { received: 0, sold: 0, returned: 0, adjusted: 0, transferred: 0 };
      const qty = Math.abs(m.quantity);
      if (m.movementType === 'received') entry.received += qty;
      else if (m.movementType === 'sold') entry.sold += qty;
      else if (m.movementType === 'returned') entry.returned += qty;
      else if (m.movementType === 'adjusted') entry.adjusted += qty;
      else if (m.movementType === 'transferred') entry.transferred += qty;
      dailyMap.set(key, entry);
    }
    const dailyActivity = Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, ...v }));

    return {
      totalValuation,
      totalUnits,
      totalSkus,
      lowCount,
      outCount,
      locationValuation,
      topSkus,
      health,
      dailyActivity,
      hasMovements: (movements ?? []).length > 0,
    };
  }, [items, movements]);

  if (loadingStock || !stats) return <div className="skeleton skeleton-row" />;

  const hasData = stats.totalSkus > 0;

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Inventory Analytics</h2>
          <p>Valuation concentration, stock health, and movement activity.</p>
        </div>
      </div>

      <div className="summary">
        <StatCard icon={<Coins size={22} />} label="Total Valuation" value={shortMoney(stats.totalValuation)} tone="primary" />
        <StatCard icon={<Package size={22} />} label="Total Units" value={formatDateTime(stats.totalUnits)} tone="success" />
        <StatCard icon={<MapPin size={22} />} label="Locations In Use" value={stats.locationValuation.length} tone="primary" />
        <StatCard
          icon={<AlertTriangle size={22} />}
          label="Items At/Below Threshold"
          value={stats.lowCount}
          tone={stats.lowCount > 0 ? 'danger' : 'success'}
        />
      </div>

      {!hasData && (
        <div className="empty">
          <div className="empty-icon"><BarChart3 size={30} /></div>
          <div className="empty-title">No stock data yet</div>
          <div className="empty-hint">Charts will populate once goods are received or adjustments are made.</div>
        </div>
      )}

      {hasData && (
        <>
          <div className="chart-grid">
            <div className="card chart-card">
              <div className="chart-header">
                <h3>Valuation by location</h3>
                <p>How much stock value sits where</p>
              </div>
              <div className="chart-canvas">
                <Doughnut
                  data={{
                    labels: stats.locationValuation.map((l) => l.location),
                    datasets: [
                      {
                        data: stats.locationValuation.map((l) => Number(l.value.toFixed(2))),
                        backgroundColor: stats.locationValuation.map((_, i) => SLICE_PALETTE[i % SLICE_PALETTE.length]),
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
                            const total = stats.locationValuation.reduce((s, l) => s + l.value, 0);
                            const pct = total === 0 ? 0 : Math.round((Number(ctx.raw) / total) * 100);
                            return `${ctx.label}: ${fullMoney(Number(ctx.raw))} (${pct}%)`;
                          },
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>

            <div className="card chart-card">
              <div className="chart-header">
                <h3>Stock health</h3>
                <p>Items by availability status</p>
              </div>
              <div className="chart-canvas">
                <Doughnut
                  data={{
                    labels: ['Healthy', 'Low stock', 'Out of stock'],
                    datasets: [
                      {
                        data: [stats.health.healthy, Math.max(0, stats.health.low), stats.health.out],
                        backgroundColor: [COLORS.success, COLORS.warning, COLORS.danger],
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
                            const total = stats.health.healthy + Math.max(0, stats.health.low) + stats.health.out;
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
              <h3>Top 10 SKUs by valuation</h3>
              <p>Where the money sits in your catalog</p>
            </div>
            <div className="chart-canvas" style={{ height: Math.max(260, stats.topSkus.length * 40) }}>
              <Bar
                data={{
                  labels: stats.topSkus.map((s) => `${s.code} · ${s.location}`),
                  datasets: [
                    {
                      label: 'Valuation',
                      data: stats.topSkus.map((s) => Number(s.value.toFixed(2))),
                      backgroundColor: COLORS.primarySoft,
                      borderColor: COLORS.primary,
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
                          return stats.topSkus[i]?.name ?? '';
                        },
                        label: (ctx) => fullMoney(Number(ctx.raw)),
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

          {stats.hasMovements && stats.dailyActivity.length > 0 && (
            <div className="card chart-card">
              <div className="chart-header">
                <h3>Movement activity — last 14 days</h3>
                <p>Units in and out by day</p>
              </div>
              <div className="chart-canvas" style={{ height: 300 }}>
                <Line
                  data={{
                    labels: stats.dailyActivity.map((d) => d.date.slice(5)),
                    datasets: [
                      {
                        label: 'Received',
                        data: stats.dailyActivity.map((d) => d.received),
                        borderColor: COLORS.success,
                        backgroundColor: 'rgba(22, 163, 74, 0.12)',
                        borderWidth: 2,
                        tension: 0.35,
                        fill: true,
                        pointRadius: 3,
                      },
                      {
                        label: 'Sold',
                        data: stats.dailyActivity.map((d) => d.sold),
                        borderColor: COLORS.sky,
                        backgroundColor: 'rgba(2, 132, 199, 0.12)',
                        borderWidth: 2,
                        tension: 0.35,
                        fill: true,
                        pointRadius: 3,
                      },
                      {
                        label: 'Adjusted',
                        data: stats.dailyActivity.map((d) => d.adjusted),
                        borderColor: COLORS.warning,
                        backgroundColor: 'rgba(234, 88, 12, 0.10)',
                        borderWidth: 2,
                        tension: 0.35,
                        pointRadius: 3,
                      },
                      {
                        label: 'Transferred',
                        data: stats.dailyActivity.map((d) => d.transferred),
                        borderColor: COLORS.violet,
                        backgroundColor: 'rgba(124, 58, 237, 0.10)',
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
                    },
                    interaction: { mode: 'index', intersect: false },
                    scales: {
                      x: { grid: { display: false } },
                      y: {
                        beginAtZero: true,
                        ticks: { callback: (v) => Number(v).toLocaleString() },
                        grid: { color: 'rgba(148, 163, 184, 0.15)' },
                      },
                    },
                  }}
                />
              </div>
            </div>
          )}

          {!stats.hasMovements && (
            <div className="card">
              <div className="chart-header">
                <h3>Movement activity</h3>
                <p>Units in and out by day</p>
              </div>
              <p style={{ color: 'var(--muted)', fontSize: 14, margin: 0 }}>
                No movements recorded in the last 14 days.
              </p>
            </div>
          )}
        </>
      )}
    </>
  );
}
