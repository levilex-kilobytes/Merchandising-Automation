import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Building2, CheckCircle2, BarChart3, Globe, TrendingUp } from 'lucide-react';
import { vendorsApi } from '../api/vendors';

import { StatCard } from '../components/StatCard';
import { Bar, Doughnut } from '../components/Charts';



const COLORS = {
  primary: '#4f46e5',
  primarySoft: 'rgba(79, 70, 229, 0.75)',
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
  COLORS.success,
  COLORS.warning,
  '#db2777',
  '#0891b2',
  '#65a30d',
];

const STATUS_LABEL: Record<string, string> = {
  active: 'Active',
  inactive: 'Inactive',
  blacklisted: 'Blacklisted',
};

const STATUS_COLOR: Record<string, string> = {
  active: COLORS.success,
  inactive: COLORS.muted,
  blacklisted: COLORS.danger,
};

export function Analytics() {
  const { data: vendors, isLoading } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => vendorsApi.list(),
  });

  const stats = useMemo(() => {
    if (!vendors) return null;

    const total = vendors.length;
    const active = vendors.filter((v) => v.status === 'active').length;
    const inactive = vendors.filter((v) => v.status === 'inactive').length;
    const blacklisted = vendors.filter((v) => v.status === 'blacklisted').length;

    // Payment terms distribution
    const termsMap = new Map<string, number>();
    for (const v of vendors) {
      const key = v.paymentTerms || 'Not set';
      termsMap.set(key, (termsMap.get(key) ?? 0) + 1);
    }
    const paymentTerms = Array.from(termsMap.entries())
      .map(([term, count]) => ({ term, count }))
      .sort((a, b) => b.count - a.count);

    // Country distribution
    const countryMap = new Map<string, number>();
    for (const v of vendors) {
      const key = v.country || 'Unknown';
      countryMap.set(key, (countryMap.get(key) ?? 0) + 1);
    }
    const countries = Array.from(countryMap.entries())
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count);
    const topCountries = countries.slice(0, 8);

    // Currency distribution
    const currencyMap = new Map<string, number>();
    for (const v of vendors) {
      const key = v.defaultCurrency || 'KES';
      currencyMap.set(key, (currencyMap.get(key) ?? 0) + 1);
    }
    const currencies = Array.from(currencyMap.entries())
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count);

    // Status composition
    const statusBreakdown = [
      { status: 'active' as const, count: active },
      { status: 'inactive' as const, count: inactive },
      { status: 'blacklisted' as const, count: blacklisted },
    ].filter((s) => s.count > 0);

    return {
      total,
      active,
      inactive,
      blacklisted,
      paymentTerms,
      countries,
      topCountries,
      currencies,
      statusBreakdown,
    };
  }, [vendors]);

  if (isLoading || !stats) return <div className="skeleton skeleton-row" />;

  const hasData = stats.total > 0;

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Vendor Analytics</h2>
          <p>Supplier composition, payment terms, and geographic spread.</p>
        </div>
      </div>

      <div className="summary">
        <StatCard icon={<Building2 size={22} />} label="Total Suppliers" value={stats.total} tone="primary" />
        <StatCard icon={<CheckCircle2 size={22} />} label="Active" value={stats.active} tone="success" />
        <StatCard icon={<Globe size={22} />} label="Countries" value={stats.countries.length} tone="primary" />
        <StatCard
          icon={<TrendingUp size={22} />}
          label="Blacklisted"
          value={stats.blacklisted}
          tone={stats.blacklisted > 0 ? 'danger' : 'success'}
        />
      </div>

      {!hasData && (
        <div className="empty">
          <div className="empty-icon"><BarChart3 size={30} /></div>
          <div className="empty-title">No suppliers yet</div>
          <div className="empty-hint">Charts populate once suppliers are added.</div>
        </div>
      )}

      {hasData && (
        <>
          <div className="chart-grid">
            <div className="card chart-card">
              <div className="chart-header">
                <h3>Payment terms distribution</h3>
                <p>How many suppliers on each terms</p>
              </div>
              <div className="chart-canvas">
                <Doughnut
                  data={{
                    labels: stats.paymentTerms.map((t) => t.term),
                    datasets: [
                      {
                        data: stats.paymentTerms.map((t) => t.count),
                        backgroundColor: stats.paymentTerms.map((_, i) => SLICE_PALETTE[i % SLICE_PALETTE.length]),
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

            <div className="card chart-card">
              <div className="chart-header">
                <h3>Supplier status</h3>
                <p>Active vs inactive vs blacklisted</p>
              </div>
              <div className="chart-canvas">
                <Doughnut
                  data={{
                    labels: stats.statusBreakdown.map((s) => STATUS_LABEL[s.status]),
                    datasets: [
                      {
                        data: stats.statusBreakdown.map((s) => s.count),
                        backgroundColor: stats.statusBreakdown.map((s) => STATUS_COLOR[s.status]),
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

          <div className="card chart-card">
            <div className="chart-header">
              <h3>Suppliers by country</h3>
              <p>Where your supply base is located</p>
            </div>
            <div className="chart-canvas" style={{ height: Math.max(240, stats.topCountries.length * 44) }}>
              <Bar
                data={{
                  labels: stats.topCountries.map((c) => c.country),
                  datasets: [
                    {
                      label: 'Suppliers',
                      data: stats.topCountries.map((c) => c.count),
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
                        label: (ctx) => {
                          const c = stats.topCountries[ctx.dataIndex];
                          const pct = stats.total === 0 ? 0 : Math.round((c.count / stats.total) * 100);
                          return `${c.count} supplier${c.count === 1 ? '' : 's'} (${pct}%)`;
                        },
                      },
                    },
                  },
                  scales: {
                    x: {
                      beginAtZero: true,
                      ticks: { precision: 0 },
                      grid: { color: 'rgba(148, 163, 184, 0.15)' },
                    },
                    y: { grid: { display: false } },
                  },
                }}
              />
            </div>
          </div>

          {stats.currencies.length > 0 && (
            <div className="card chart-card">
              <div className="chart-header">
                <h3>Currency exposure</h3>
                <p>How many suppliers quote in each currency</p>
              </div>
              <div className="chart-canvas" style={{ height: 240 }}>
                <Bar
                  data={{
                    labels: stats.currencies.map((c) => c.code),
                    datasets: [
                      {
                        label: 'Suppliers',
                        data: stats.currencies.map((c) => c.count),
                        backgroundColor: COLORS.violetSoft,
                        borderColor: COLORS.violet,
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
                          label: (ctx) => `${ctx.raw} supplier${Number(ctx.raw) === 1 ? '' : 's'}`,
                        },
                      },
                    },
                    scales: {
                      x: { grid: { display: false } },
                      y: {
                        beginAtZero: true,
                        ticks: { precision: 0 },
                        grid: { color: 'rgba(148, 163, 184, 0.15)' },
                      },
                    },
                  }}
                />
              </div>
            </div>
          )}

          <div className="card">
            <div className="chart-header">
              <h3>Payment terms — details</h3>
              <p>Full breakdown of terms across all suppliers</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Terms</th>
                  <th className="num">Suppliers</th>
                  <th>Share</th>
                </tr>
              </thead>
              <tbody>
                {stats.paymentTerms.map((t) => {
                  const pct = stats.total === 0 ? 0 : Math.round((t.count / stats.total) * 100);
                  return (
                    <tr key={t.term}>
                      <td><span className="mono">{t.term}</span></td>
                      <td className="num">{t.count}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 6, background: 'var(--bg)', borderRadius: 999, overflow: 'hidden', maxWidth: 200 }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: COLORS.primary }} />
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
