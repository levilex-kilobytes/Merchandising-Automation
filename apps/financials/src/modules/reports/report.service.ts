import { pool } from '../../config/database';

export interface AccountBalance {
  accountCode: string;
  accountName: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  normalBalance: 'debit' | 'credit';
  debitTotal: number;
  creditTotal: number;
  balance: number;
}

export class ReportService {
  async trialBalance(): Promise<{ accounts: AccountBalance[]; totalDebits: number; totalCredits: number }> {
    const { rows } = await pool.query<{
      code: string; name: string; type: string; normal_balance: string;
      debit_total: string; credit_total: string;
    }>(
      `SELECT a.code, a.name, a.type, a.normal_balance,
              COALESCE(SUM(jl.debit), 0) AS debit_total,
              COALESCE(SUM(jl.credit), 0) AS credit_total
       FROM accounts a
       LEFT JOIN journal_lines jl ON jl.account_id = a.id
       GROUP BY a.id, a.code, a.name, a.type, a.normal_balance
       ORDER BY a.code`,
    );

    const accounts: AccountBalance[] = rows.map((r) => {
      const debitTotal = Number(r.debit_total);
      const creditTotal = Number(r.credit_total);
      const isDebit = r.normal_balance === 'debit';
      const balance = isDebit ? debitTotal - creditTotal : creditTotal - debitTotal;
      return {
        accountCode: r.code,
        accountName: r.name,
        type: r.type as AccountBalance['type'],
        normalBalance: r.normal_balance as AccountBalance['normalBalance'],
        debitTotal, creditTotal, balance,
      };
    });

    return {
      accounts,
      totalDebits: accounts.reduce((s, a) => s + a.debitTotal, 0),
      totalCredits: accounts.reduce((s, a) => s + a.creditTotal, 0),
    };
  }

  async profitAndLoss(): Promise<{
    revenue: Array<{ code: string; name: string; amount: number }>;
    expenses: Array<{ code: string; name: string; amount: number }>;
    totalRevenue: number;
    totalExpenses: number;
    grossProfit: number;
    netProfit: number;
  }> {
    const tb = await this.trialBalance();

    const revenueAccounts = tb.accounts
      .filter((a) => a.type === 'revenue')
      .map((a) => ({ code: a.accountCode, name: a.accountName, amount: a.balance }));

    const expenseAccounts = tb.accounts
      .filter((a) => a.type === 'expense')
      .map((a) => ({ code: a.accountCode, name: a.accountName, amount: a.balance }));

    const totalRevenue = revenueAccounts.reduce((s, a) => s + a.amount, 0);
    const totalExpenses = expenseAccounts.reduce((s, a) => s + a.amount, 0);

    const cogs = expenseAccounts.find((a) => a.code === '5000')?.amount ?? 0;
    const grossProfit = totalRevenue - cogs;

    return {
      revenue: revenueAccounts,
      expenses: expenseAccounts,
      totalRevenue,
      totalExpenses,
      grossProfit,
      netProfit: totalRevenue - totalExpenses,
    };
  }

  async balanceSheet(): Promise<{
    assets: Array<{ code: string; name: string; amount: number }>;
    liabilities: Array<{ code: string; name: string; amount: number }>;
    equity: Array<{ code: string; name: string; amount: number }>;
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
  }> {
    const tb = await this.trialBalance();
    const assets = tb.accounts.filter((a) => a.type === 'asset').map((a) => ({ code: a.accountCode, name: a.accountName, amount: a.balance }));
    const liabilities = tb.accounts.filter((a) => a.type === 'liability').map((a) => ({ code: a.accountCode, name: a.accountName, amount: a.balance }));
    const equity = tb.accounts.filter((a) => a.type === 'equity').map((a) => ({ code: a.accountCode, name: a.accountName, amount: a.balance }));

    // Retained earnings: net profit rolls into equity
    const pl = await this.profitAndLoss();
    if (pl.netProfit !== 0) {
      equity.push({ code: 'RE', name: 'Retained Earnings (current period)', amount: pl.netProfit });
    }

    return {
      assets,
      liabilities,
      equity,
      totalAssets: assets.reduce((s, a) => s + a.amount, 0),
      totalLiabilities: liabilities.reduce((s, a) => s + a.amount, 0),
      totalEquity: equity.reduce((s, a) => s + a.amount, 0),
    };
  }
}
