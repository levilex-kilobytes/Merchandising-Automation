import { ReturnRepository } from './return.repository';
import { SaleRepository } from '../sale/sale.repository';
import { OutboxRepository } from '../../shared/outbox.repository';
import { generateReturnNumber } from '../../shared/generate-number';
import { CreateReturnDto, SaleReturn } from './return.types';
import { NotFoundError, ConflictError, ValidationError } from '@mfa/errors';

export class ReturnService {
  constructor(
    private readonly repo = new ReturnRepository(),
    private readonly sales = new SaleRepository(),
    private readonly outbox = new OutboxRepository(),
  ) {}

  async create(input: CreateReturnDto): Promise<SaleReturn> {
    if (!input.lines.length) throw new ValidationError('Return must have at least one line');

    const sale = await this.sales.findById(input.originalSaleId);
    if (!sale) throw new NotFoundError(`Sale ${input.originalSaleId} not found`);
    if (sale.status !== 'completed') throw new ConflictError(`Cannot return against ${sale.status} sale`);

    const saleLines = sale.lines ?? [];
    const priced = [];
    let refundTotal = 0;

    for (const l of input.lines) {
      const original = saleLines.find((s) => s.productCode === l.productCode);
      if (!original) throw new ConflictError(`Product ${l.productCode} not on original sale`);
      if (l.quantity > original.quantity) throw new ConflictError(`Cannot return more ${l.productCode} than purchased`);
      const refundAmount = Number((original.unitPrice * l.quantity).toFixed(2));
      refundTotal += refundAmount;
      priced.push({ productCode: l.productCode, quantity: l.quantity, refundAmount });
    }

    const returnNumber = generateReturnNumber();

    return this.repo.withTransaction(async (tx) => {
      const ret = await this.repo.create(tx, {
        returnNumber, originalSaleId: input.originalSaleId,
        storeLocation: sale.storeLocation, reason: input.reason ?? null, refundTotal,
      });
      for (const line of priced) await this.repo.addLine(tx, ret.id, line);
      await this.outbox.enqueue(tx, {
        eventType: 'retail-sales.return.completed',
        aggregateId: ret.id,
        payload: {
          returnId: ret.id, returnNumber, originalSaleId: input.originalSaleId,
          storeLocation: sale.storeLocation, refundTotal,
          lines: priced,
          completedAt: new Date().toISOString(),
        },
      });
      return (await this.repo.findById(ret.id)) as SaleReturn;
    });
  }

  async get(id: string): Promise<SaleReturn> {
    const r = await this.repo.findById(id);
    if (!r) throw new NotFoundError(`Return ${id} not found`);
    return r;
  }

  async list(): Promise<SaleReturn[]> { return this.repo.list(); }
}
