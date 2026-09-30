import { api } from './client';
import { Account, JournalEntry, SupplierBill, TrialBalance, ProfitAndLoss, BalanceSheet, APAgingBucket } from './types';

function qs(params: Record<string, string | undefined>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') p.set(k, v);
  }
  const s = p.toString();
  return s ? `?${s}` : '';
}

export const financeApi = {
  listAccounts: () => api.get<Account[]>('/accounts'),
  getAccount: (code: string) => api.get<Account>(`/accounts/${code}`),

  listEntries: (filter?: { referenceType?: string; referenceId?: string; fromDate?: string; toDate?: string }) =>
    api.get<JournalEntry[]>(`/journal-entries${qs({
      referenceType: filter?.referenceType,
      referenceId: filter?.referenceId,
      fromDate: filter?.fromDate,
      toDate: filter?.toDate,
    })}`),
  getEntry: (id: string) => api.get<JournalEntry>(`/journal-entries/${id}`),

  listBills: (filter?: { supplierId?: string; status?: string }) =>
    api.get<SupplierBill[]>(`/supplier-bills${qs({
      supplierId: filter?.supplierId,
      status: filter?.status,
    })}`),
  getBill: (id: string) => api.get<SupplierBill>(`/supplier-bills/${id}`),
  payBill: (id: string, amount: number) => api.post<SupplierBill>(`/supplier-bills/${id}/pay`, { amount }),

  trialBalance: () => api.get<TrialBalance>('/reports/trial-balance'),
  profitAndLoss: () => api.get<ProfitAndLoss>('/reports/profit-and-loss'),
  balanceSheet: () => api.get<BalanceSheet>('/reports/balance-sheet'),
  apAging: () => api.get<APAgingBucket[]>('/reports/ap-aging'),
};
