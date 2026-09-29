import { SaleRepository } from './sale.repository';
import { PricingService } from '../pricing/pricing.service';
import { InventoryClient } from '../../grpc/inventory.client';
import { OutboxRepository } from '../../shared/outbox.repository';
import { generateSaleNumber } from '../../shared/generate-number';
import { CreateSaleDto, Sale } from './sale.types';
import { ConflictError, ValidationError } from '@mfa/errors';
import { config } from '../../config';

export class SaleService {
  constructor(
    private readonly repo = new SaleRepository(),
    private readonly pricing = new PricingService(),
    private readonly inventory = new InventoryClient(),
    private readonly outbox = new OutboxRepository(),
  ) {}

  async create(input: CreateSaleDto): Promise<Sale> {
    if (!input.lines.length) throw new ValidationError('Sale must have at least one line');
    if (!input.payments.length) throw new ValidationError('Sale must have at least one payment');

    const priced = [];
    let subtotal = 0;
    let discountTotal = 0;

    for (const l of input.lines) {
      const p = await this.pricing.getPrice(l.productCode);
      const discount = l.discountAmount ?? 0;
      const lineTotal = p.unitPrice * l.quantity - discount;
      subtotal += p.unitPrice * l.quantity;
      discountTotal += discount;
      priced.push({ productCode: l.productCode, productName: p.productName, quantity: l.quantity, unitPrice: p.unitPrice, discountAmount: discount, lineTotal });
    }

    const taxTotal = Number(((subtotal - discountTotal) * config.TAX_RATE).toFixed(2));
    const grandTotal = Number((subtotal - discountTotal + taxTotal).toFixed(2));

    const paidTotal = input.payments.reduce((s, p) => s + p.amount, 0);
    if (Math.abs(paidTotal - grandTotal) > 0.01) {
      throw new ConflictError(`Payments (${paidTotal}) do not match total (${grandTotal})`);
    }

    const stockCheck = await this.inventory.validateStock(input.storeLocation, priced.map((l) => ({ productCode: l.productCode, quantity: l.quantity })));
    const unavailable = stockCheck.filter((r) => !r.available);
    if (unavailable.length) {
      throw new ConflictError(`Insufficient stock: ${unavailable.map((u) => u.productCode).join(', ')}`);
    }

    const saleNumber = generateSaleNumber();

    return this.repo.withTransaction(async (tx) => {
      const sale = await this.repo.create(tx, {
        saleNumber, storeLocation: input.storeLocation, cashierId: input.cashierId ?? null,
        subtotal, discountTotal, taxTotal, grandTotal,
      });
      for (const line of priced) await this.repo.addLine(tx, sale.id, line);
      for (const p of input.payments) {
        await this.repo.addPayment(tx, sale.id, { method: p.method, amount: p.amount, reference: p.reference ?? null });
      }
      await this.outbox.enqueue(tx, {
        eventType: 'retail-sales.sale.completed',
        aggregateId: sale.id,
        payload: {
          saleId: sale.id, saleNumber, storeLocation: sale.storeLocation,
          grandTotal, taxTotal,
          lines: priced.map((l) => ({ productCode: l.productCode, quantity: l.quantity, unitPrice: l.unitPrice, lineTotal: l.lineTotal })),
          payments: input.payments.map((p) => ({ method: p.method, amount: p.amount })),
          completedAt: new Date().toISOString(),
        },
      });
      return (await this.repo.findById(sale.id)) as Sale;
    });
  }

  async get(id: string): Promise<Sale> {
    const s = await this.repo.findById(id);
    if (!s) throw new ConflictError(`Sale ${id} not found`);
    return s;
  }

  async list(filter: { storeLocation?: string; status?: string }): Promise<Sale[]> {
    return this.repo.list(filter);
  }

  async void(id: string): Promise<Sale> {
    const sale = await this.get(id);
    if (sale.status !== 'completed') throw new ConflictError(`Sale already ${sale.status}`);
    return this.repo.withTransaction(async (tx) => {
      const v = await this.repo.void(tx, id);
      await this.outbox.enqueue(tx, {
        eventType: 'retail-sales.sale.voided',
        aggregateId: id,
        payload: { saleId: id, saleNumber: sale.saleNumber, storeLocation: sale.storeLocation, grandTotal: sale.grandTotal },
      });
      return v;
    });
  }
}
