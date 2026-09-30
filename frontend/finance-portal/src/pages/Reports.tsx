import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileBarChart } from 'lucide-react';
import { financeApi } from '../api/finance';

const fullMoney = (n: number) => `KES ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

type Tab = 'tb' | 'pl' | 'bs';

export function Reports() {
  const [tab, setTab] = useState<Tab>('pl');

  const { data: tb, isLoading: tbLoading } = useQuery({
    queryKey: ['tb'],
    queryFn: () => financeApi.trialBalance(),
    staleTime: 0,
    enabled: tab === 'tb',
  });

  const { data: pl, isLoading: plLoading } = useQuery({
    queryKey: ['pnl'],
    queryFn: () => financeApi.profitAndLoss(),
    staleTime: 0,
    enabled: tab === 'pl',
  });

  const { data: bs, isLoading: bsLoading } = useQuery({
    queryKey: ['bs'],
    queryFn: () => financeApi.balanceSheet(),
    staleTime: 0,
    enabled: tab === 'bs',
  });

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Financial Reports</h2>
          <p>Generated live from the general ledger.</p>
        </div>
      </div>

      <div className="ledger-tabs">
        <button className={`ledger-tab ${tab === 'pl' ? 'active' : ''}`} onClick={() => setTab('pl')}>
          <FileBarChart size={16} /> Profit &amp; Loss
        </button>
        <button className={`ledger-tab ${tab === 'bs' ? 'active' : ''}`} onClick={() => setTab('bs')}>
          <FileBarChart size={16} /> Balance Sheet
        </button>
        <button className={`ledger-tab ${tab === 'tb' ? 'active' : ''}`} onClick={() => setTab('tb')}>
          <FileBarChart size={16} /> Trial Balance
        </button>
      </div>

      {/* ── P&L ── */}
      {tab === 'pl' && (
        <>
          {plLoading && <div className="skeleton skeleton-row" />}
          {pl && (
            <div className="report-summary">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Profit &amp; Loss</h3>
                  <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2, marginBottom: 0 }}>Current period, cumulative</p>
                </div>
              </div>

              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, color: 'var(--muted)', marginBottom: 8 }}>Revenue</div>
              {pl.revenue.length === 0 ? (
                <p style={{ color: 'var(--muted)', fontSize: 14 }}>No revenue recorded.</p>
              ) : pl.revenue.map((r) => (
                <div key={r.code} className="report-row">
                  <span className="label"><code>{r.code}</code> {r.name}</span>
                  <span className="value">{fullMoney(r.amount)}</span>
                </div>
              ))}
              <div className="report-row subtotal">
                <span>Total Revenue</span>
                <span className="value">{fullMoney(pl.totalRevenue)}</span>
              </div>

              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, color: 'var(--muted)', marginTop: 20, marginBottom: 8 }}>Expenses</div>
              {pl.expenses.length === 0 ? (
                <p style={{ color: 'var(--muted)', fontSize: 14 }}>No expenses recorded.</p>
              ) : pl.expenses.map((e) => (
                <div key={e.code} className="report-row">
                  <span className="label"><code>{e.code}</code> {e.name}</span>
                  <span className="value">{fullMoney(e.amount)}</span>
                </div>
              ))}
              <div className="report-row subtotal">
                <span>Total Expenses</span>
                <span className="value">{fullMoney(pl.totalExpenses)}</span>
              </div>

              <div className="report-row" style={{ marginTop: 20, fontSize: 16 }}>
                <span>Gross Profit</span>
                <span className="value">{fullMoney(pl.grossProfit)}</span>
              </div>
              <div className="report-row total">
                <span>Net Profit</span>
                <span className="value" style={{ color: pl.netProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                  {fullMoney(pl.netProfit)}
                </span>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Balance Sheet ── */}
      {tab === 'bs' && (
        <>
          {bsLoading && <div className="skeleton skeleton-row" />}
          {bs && (
            <div className="report-summary">
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Balance Sheet</h3>
                <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2, marginBottom: 0 }}>As of today</p>
              </div>

              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, color: 'var(--muted)', marginBottom: 8 }}>Assets</div>
              {bs.assets.length === 0 ? <p style={{ color: 'var(--muted)', fontSize: 14 }}>No assets posted.</p> : bs.assets.map((a) => (
                <div key={a.code} className="report-row">
                  <span className="label"><code>{a.code}</code> {a.name}</span>
                  <span className="value">{fullMoney(a.amount)}</span>
                </div>
              ))}
              <div className="report-row subtotal">
                <span>Total Assets</span>
                <span className="value">{fullMoney(bs.totalAssets)}</span>
              </div>

              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, color: 'var(--muted)', marginTop: 20, marginBottom: 8 }}>Liabilities</div>
              {bs.liabilities.length === 0 ? <p style={{ color: 'var(--muted)', fontSize: 14 }}>No liabilities posted.</p> : bs.liabilities.map((l) => (
                <div key={l.code} className="report-row">
                  <span className="label"><code>{l.code}</code> {l.name}</span>
                  <span className="value">{fullMoney(l.amount)}</span>
                </div>
              ))}
              <div className="report-row subtotal">
                <span>Total Liabilities</span>
                <span className="value">{fullMoney(bs.totalLiabilities)}</span>
              </div>

              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, color: 'var(--muted)', marginTop: 20, marginBottom: 8 }}>Equity</div>
              {bs.equity.map((e) => (
                <div key={e.code} className="report-row">
                  <span className="label"><code>{e.code}</code> {e.name}</span>
                  <span className="value">{fullMoney(e.amount)}</span>
                </div>
              ))}
              <div className="report-row subtotal">
                <span>Total Equity</span>
                <span className="value">{fullMoney(bs.totalEquity)}</span>
              </div>

              <div className="report-row total">
                <span>Liabilities + Equity</span>
                <span className="value" style={{ color: Math.abs((bs.totalLiabilities + bs.totalEquity) - bs.totalAssets) < 0.01 ? 'var(--success)' : 'var(--danger)' }}>
                  {fullMoney(bs.totalLiabilities + bs.totalEquity)}
                </span>
              </div>

              {Math.abs((bs.totalLiabilities + bs.totalEquity) - bs.totalAssets) >= 0.01 && (
                <div style={{ marginTop: 12, padding: 12, background: 'var(--danger-soft)', color: '#991b1b', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
                  ⚠ Balance sheet does not balance. Check journal entries for missing contra postings.
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Trial Balance ── */}
      {tab === 'tb' && (
        <>
          {tbLoading && <div className="skeleton skeleton-row" />}
          {tb && (
            <>
              <div className="summary">
                <div className="stat stat-primary">
                  <div className="stat-icon"><FileBarChart size={22} /></div>
                  <div>
                    <div className="stat-value">{fullMoney(tb.totalDebits)}</div>
                    <div className="stat-label">Total Debits</div>
                  </div>
                </div>
                <div className="stat stat-success">
                  <div className="stat-icon"><FileBarChart size={22} /></div>
                  <div>
                    <div className="stat-value">{fullMoney(tb.totalCredits)}</div>
                    <div className="stat-label">Total Credits</div>
                  </div>
                </div>
                <div className={`stat stat-${Math.abs(tb.totalDebits - tb.totalCredits) < 0.01 ? 'success' : 'danger'}`}>
                  <div className="stat-icon"><FileBarChart size={22} /></div>
                  <div>
                    <div className="stat-value">
                      {Math.abs(tb.totalDebits - tb.totalCredits) < 0.01 ? 'Balanced' : 'Off by ' + fullMoney(Math.abs(tb.totalDebits - tb.totalCredits))}
                    </div>
                    <div className="stat-label">Ledger Status</div>
                  </div>
                </div>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Account</th>
                    <th>Type</th>
                    <th className="num">Debits</th>
                    <th className="num">Credits</th>
                    <th className="num">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {tb.accounts.map((a) => (
                    <tr key={a.accountCode}>
                      <td><span className="mono" style={{ fontWeight: 700 }}>{a.accountCode}</span></td>
                      <td>{a.accountName}</td>
                      <td><span className="badge badge-posted" style={{ textTransform: 'capitalize' }}>{a.type}</span></td>
                      <td className="num">{fullMoney(a.debitTotal)}</td>
                      <td className="num">{fullMoney(a.creditTotal)}</td>
                      <td className="num">
                        <strong>{fullMoney(a.balance)}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#f8fafc', fontWeight: 800 }}>
                    <td colSpan={3}>Totals</td>
                    <td className="num">{fullMoney(tb.totalDebits)}</td>
                    <td className="num">{fullMoney(tb.totalCredits)}</td>
                    <td className="num">—</td>
                  </tr>
                </tfoot>
              </table>
            </>
          )}
        </>
      )}
    </>
  );
}
