export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

export interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  normalBalance: 'debit' | 'credit';
  isActive: boolean;
}

export interface JournalLine {
  id: string;
  entryId: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description: string | null;
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  entryDate: string;
  description: string | null;
  referenceType: string | null;
  referenceId: string | null;
  status: string;
  postedAt: string;
  createdAt: string;
  lines?: JournalLine[];
}

export interface SupplierBill {
  id: string;
  billNumber: string;
  supplierId: string;
  supplierName: string;
  grnId: string | null;
  amount: number;
  paidAmount: number;
  outstanding: number;
  status: 'open' | 'partial' | 'paid' | 'overdue';
  dueDate: string;
  issuedAt: string;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AccountBalance {
  accountCode: string;
  accountName: string;
  type: AccountType;
  normalBalance: 'debit' | 'credit';
  debitTotal: number;
  creditTotal: number;
  balance: number;
}

export interface TrialBalance {
  accounts: AccountBalance[];
  totalDebits: number;
  totalCredits: number;
}

export interface ProfitAndLoss {
  revenue: Array<{ code: string; name: string; amount: number }>;
  expenses: Array<{ code: string; name: string; amount: number }>;
  totalRevenue: number;
  totalExpenses: number;
  grossProfit: number;
  netProfit: number;
}

export interface BalanceSheet {
  assets: Array<{ code: string; name: string; amount: number }>;
  liabilities: Array<{ code: string; name: string; amount: number }>;
  equity: Array<{ code: string; name: string; amount: number }>;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
}

export interface APAgingBucket {
  bucket: string;
  count: number;
  total: number;
}
