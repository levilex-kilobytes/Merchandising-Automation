import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Coins, Receipt, ArrowRight } from 'lucide-react';
import { financeApi } from '../api/finance';
import { StatCard } from '../components/StatCard';
import { Bar, Doughnut } from '../components/Charts';
import { formatISODate } from '../utils/format';

const shortMoney = (n: number) => `KES ${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
const fullMoney = (n: number) => `KES ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const COLORS = {
  success: '#16a34a',
  successSoft: 'rgba(22, 163, 74, 0.75)',
  danger: '#dc2626',
  dangerSoft: 'rgba(220, 38, 38, 0.75)',
  primary: '#1e3a8a',
  primarySoft: 'rgba(30, 58, 138, 0.75)',
  warning: '#ea580c',
  warningSoft: 'rgba(234, 88, 12, 0.75)',
  sky: '#0284c7',
  skySoft: 'rgba(2, 132, 199, 0.75)',
  muted: '#94a3b8',
};

export function Overview() {
  const { data: pl, isLoading: plLoading } = useQuery({
    queryKey: ['pnl'],
    queryFn: () => financeApi.profitAndLoss(),
    staleTime: 0,
  });

  const { data: bs, isLoading: bsLoading } = useQuery({
    queryKey: ['bs'],
    queryFn: () => financeApi.balanceSheet(),
    staleTime: 0,
  });

  const { data: bills, isLoading: billsLoading } = useQuery({
    queryKey: ['bills'],
    queryFn: () => financeApi.listBills(),
    staleTime: 0,
  });

  const { data: entries } = useQuery({
    queryKey: ['entries-recent'],
    queryFn: () => financeApi.listEntries(),
  });

  if (plLoading || bsLoading || billsLoading || !pl || !bs) {
    return <div className="skeleton skeleton-row" />;
  }

  const openBills = (bills ?? []).filter((b) => b.status !== 'paid');
  const totalOutstanding = openBills.reduce((s, b) => s + b.outstanding, 0);
  const overdueBills = openBills.filter((b) => new Date(b.dueDate) < new Date());
  const recentEntries = (entries ?? []).slice(0, 6);

  const revenueChart = {
    labels: pl.revenue.map((r) => r.name),
    datasets: [
      {
        data: pl.revenue.map((r) => Number(r.amount.toFixed(2))),
        backgroundColor: COLORS.successSoft,
        borderColor: COLORS.success,
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const expenseChart = {
    labels: pl.expenses.map((e) => e.name),
    datasets: [
      {
        data: pl.expenses.map((e) => Number(e.amount.toFixed(2))),
        backgroundColor: COLORS.dangerSoft,
        borderColor: COLORS.danger,
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const bsComposition = {
    labels: ['Assets', 'Liabilities', 'Equity'],
    datasets: [
      {
        data: [bs.totalAssets, bs.totalLiabilities, bs.totalEquity],
        backgroundColor: [COLORS.primary, COLORS.warning, COLORS.success],
        borderWidth: 0,
        hoverOffset: 6,
      },
    ],
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Financial Overview</h2>
          <p>Real-time view of profitability, position, and obligations.</p>
        </div>
      </div>

      <div className="summary">
        <StatCard icon={<TrendingUp size={22} />} label="Total Revenue" value={shortMoney(pl.totalRevenue)} tone="success" />
        <StatCard icon={<TrendingDown size={22} />} label="Total Expenses" value={shortMoney(pl.totalExpenses)} tone="danger" />
        <StatCard
          icon={<Coins size={22} />}
          label="Net Profit"
          value={shortMoney(pl.netProfit)}
          tone={pl.netProfit >= 0 ? 'success' : 'danger'}
        />
        <StatCard
          icon={<Receipt size={22} />}
          label="Outstanding Payables"
          value={shortMoney(totalOutstanding)}
          tone={totalOutstanding > 0 ? 'warning' : 'success'}
        />
      </div>

      <div className="chart-grid">
        <div className="card chart-card">
          <div className="chart-header">
            <h3>Revenue accounts</h3>
            <p>Where income is booked</p>
          </div>
          <div className="chart-canvas">
            {pl.revenue.length === 0 ? (
              <p style={{ color: 'var(--muted)', fontSize: 14 }}>No revenue recorded yet.</p>
            ) : (
              <Bar
                data={revenueChart}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  indexAxis: 'y' as const,
                  plugins: {
                    legend: { display: false },
                    tooltip: { callbacks: { label: (ctx) => fullMoney(Number(ctx.raw)) } },
                  },
                  scales: {
                    x: { ticks: { callback: (v) => shortMoney(Number(v)) }, grid: { color: 'rgba(148, 163, 184, 0.15)' } },
                    y: { grid: { display: false } },
                  },
                }}
              />
            )}
          </div>
        </div>

        <div className="card chart-card">
          <div className="chart-header">
            <h3>Balance sheet composition</h3>
            <p>Assets vs liabilities vs equity</p>
          </div>
          <div className="chart-canvas">
            {bs.totalAssets === 0 && bs.totalLiabilities === 0 && bs.totalEquity === 0 ? (
              <p style={{ color: 'var(--muted)', fontSize: 14 }}>No postings yet.</p>
            ) : (
              <Doughnut
                data={bsComposition}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: '62%',
                  plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 12, padding: 14 } },
                    tooltip: {
                      callbacks: {
                        label: (ctx) => {
                          const total = bs.totalAssets + bs.totalLiabilities + bs.totalEquity;
                          const pct = total === 0 ? 0 : Math.round((Number(ctx.raw) / total) * 100);
                          return `${ctx.label}: ${fullMoney(Number(ctx.raw))} (${pct}%)`;
                        },
                      },
                    },
                  },
                }}
              />
            )}
          </div>
        </div>
      </div>

      <div className="chart-grid">
        <div className="card chart-card">
          <div className="chart-header">
            <h3>Expense accounts</h3>
            <p>Where costs are landing</p>
          </div>
          <div className="chart-canvas">
            {pl.expenses.length === 0 ? (
              <p style={{ color: 'var(--muted)', fontSize: 14 }}>No expenses recorded yet.</p>
            ) : (
              <Bar
                data={expenseChart}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  indexAxis: 'y' as const,
                  plugins: {
                    legend: { display: false },
                    tooltip: { callbacks: { label: (ctx) => fullMoney(Number(ctx.raw)) } },
                  },
                  scales: {
                    x: { ticks: { callback: (v) => shortMoney(Number(v)) }, grid: { color: 'rgba(148, 163, 184, 0.15)' } },
                    y: { grid: { display: false } },
                  },
                }}
              />
            )}
          </div>
        </div>

        <div className="card chart-card">
          <div className="chart-header">
            <h3>Payables health</h3>
            <p>Bills by status</p>
          </div>
          <div className="chart-canvas">
            {openBills.length === 0 && (bills ?? []).length === 0 ? (
              <p style={{ color: 'var(--muted)', fontSize: 14 }}>No supplier bills yet.</p>
            ) : (
              <Doughnut
                data={{
                  labels: ['Open', 'Overdue'],
                  datasets: [
                    {
                      data: [
                        openBills.length - overdueBills.length,
                        overdueBills.length,
                      ],
                      backgroundColor: [COLORS.warningSoft, COLORS.dangerSoft],
                      borderColor: [COLORS.warning, COLORS.danger],
                      borderWidth: 1,
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
                          const total = openBills.length;
                          const pct = total === 0 ? 0 : Math.round((Number(ctx.raw) / total) * 100);
                          return `${ctx.label}: ${ctx.raw} (${pct}%)`;
                        },
                      },
                    },
                  },
                }}
              />
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="chart-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap' }}>
          <div>
            <h3>Recent journal entries</h3>
            <p>The last six postings across all sources</p>
          </div>
          <Link to="/ledger" className="btn-ghost btn-sm">
            View full ledger <ArrowRight size={14} />
          </Link>
        </div>
        {recentEntries.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>No journal entries yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Entry #</th>
                <th>Date</th>
                <th>Description</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {recentEntries.map((e) => (
                <tr key={e.id}>
                  <td><span className="mono" style={{ fontWeight: 700 }}>{e.entryNumber}</span></td>
                  <td style={{ whiteSpace: 'nowrap' }}>{formatISODate(e.entryDate)}</td>
                  <td>{e.description ?? '—'}</td>
                  <td>
                    {e.referenceType ? (
                      <span className="badge badge-posted" style={{ textTransform: 'none' }}>{e.referenceType}</span>
                    ) : '—'}
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
