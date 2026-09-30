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
  issuedAt: Date;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
