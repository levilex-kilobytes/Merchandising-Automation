import { PoolClient } from 'pg';
import { APRepository } from './ap.repository';
import { JournalService } from '../journal/journal.service';
import { SupplierBill } from './ap.types';
import { NotFoundError, ConflictError } from '@mfa/errors';
import { config } from '../../config';
import { generateBillNumber } from '../../shared/generate-number';

export class APService {
  constructor(
    private readonly repo = new APRepository(),
    private readonly journal = new JournalService(),
  ) {}

  async createForGRN(tx: PoolClient, input: {
    supplierId: string; supplierName: string; grnId: string;
    amount: number; unitCostByProduct: Record<string, number>;
    lines: Array<{ productCode: string; receivedQty: number; unitCost: number }>;
  }): Promise<SupplierBill | null> {
    // Idempotency: if a bill already exists for this GRN, skip
    if (await this.repo.existsForGRN(input.grnId, tx)) {
      return null;
    }
    const due = new Date();
    due.setDate(due.getDate() + config.AP_DEFAULT_TERMS_DAYS);
    const dueDate = due.toISOString().slice(0, 10);

    const bill = await this.repo.create(tx, {
      billNumber: generateBillNumber(),
      supplierId: input.supplierId,
      supplierName: input.supplierName,
      grnId: input.grnId,
      amount: Number(input.amount.toFixed(2)),
      dueDate,
    });

    await this.journal.postFromEvent(tx, {
      description: `Goods received — GRN ${input.grnId.slice(0, 8)}`,
      referenceType: 'grn',
      referenceId: input.grnId,
      lines: [
        { accountCode: '1200', debit: input.amount, description: 'Inventory increase' },
        { accountCode: '2000', credit: input.amount, description: `Payable to ${input.supplierName}` },
      ],
    });

    await tx.query(
      `INSERT INTO product_costs (product_code, unit_cost, updated_at)
       SELECT * FROM UNNEST($1::text[], $2::numeric[], $3::timestamptz[])
       ON CONFLICT (product_code) DO UPDATE SET unit_cost = EXCLUDED.unit_cost, updated_at = EXCLUDED.updated_at`,
      [
        input.lines.map((l) => l.productCode),
        input.lines.map((l) => l.unitCost),
        input.lines.map(() => new Date()),
      ],
    );

    return bill;
  }

  async get(id: string): Promise<SupplierBill> {
    const b = await this.repo.findById(id);
    if (!b) throw new NotFoundError(`Bill ${id} not found`);
    return b;
  }

  async list(filter: { supplierId?: string; status?: string }): Promise<SupplierBill[]> {
    return this.repo.list(filter);
  }

  async pay(id: string, amount: number): Promise<SupplierBill> {
    return this.repo.withTransaction(async (tx) => {
      const bill = await this.repo.findById(id, tx);
      if (!bill) throw new NotFoundError(`Bill ${id} not found`);
      if (bill.status === 'paid') throw new ConflictError('Bill already fully paid');

      const updated = await this.repo.recordPayment(tx, id, Number(amount.toFixed(2)));

      await this.journal.postFromEvent(tx, {
        description: `Payment to ${bill.supplierName} — ${bill.billNumber}`,
        referenceType: 'bill',
        referenceId: id,
        lines: [
          { accountCode: '2000', debit: amount, description: 'Reduce payable' },
          { accountCode: '1000', credit: amount, description: 'Cash payment' },
        ],
      });

      return updated;
    });
  }

  async aging() { return this.repo.aging(); }
}
