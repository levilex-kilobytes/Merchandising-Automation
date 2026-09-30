import { EventBus } from '@mfa/event-bus';
import { Logger } from '@mfa/logger';
import { JournalService } from '../../modules/journal/journal.service';
import { withTransaction, pool } from '../../config/database';
import { config } from '../../config';

interface Payload {
  saleId: string;
  saleNumber: string;
  storeLocation: string;
  grandTotal: number;
  taxTotal: number;
  lines: Array<{ productCode: string; quantity: number; unitPrice: number; lineTotal: number }>;
  payments: Array<{ method: string; amount: number }>;
  completedAt: string;
}

export async function registerSaleCompletedHandler(
  bus: EventBus,
  logger: Logger,
  journal: JournalService,
): Promise<void> {
  await bus.subscribe<Payload>('retail-sales.sale.completed', async (event) => {
    const p = event.payload;
    const subtotal = Number((p.grandTotal - p.taxTotal).toFixed(2));
    const tax = Number(p.taxTotal.toFixed(2));
    const gross = Number(p.grandTotal.toFixed(2));

    const cashAmount = p.payments.filter((x) => x.method === 'cash').reduce((s, x) => s + x.amount, 0);
    const cardAmount = p.payments.filter((x) => x.method === 'card').reduce((s, x) => s + x.amount, 0);
    const giftAmount = p.payments.filter((x) => x.method === 'gift_card').reduce((s, x) => s + x.amount, 0);
    const otherAmount = Number((gross - cashAmount - cardAmount - giftAmount).toFixed(2));

    const cogs = Number((subtotal * config.COGS_RATIO).toFixed(2));

    const entryDate = (p.completedAt ?? new Date().toISOString()).slice(0, 10);

    try {
      await withTransaction(async (tx) => {
        const lines: Array<{ accountCode: string; debit?: number; credit?: number; description?: string }> = [];

        if (cashAmount > 0) lines.push({ accountCode: '1000', debit: cashAmount, description: 'Cash received' });
        if (cardAmount > 0) lines.push({ accountCode: '1010', debit: cardAmount, description: 'Card settlement' });
        if (giftAmount > 0) lines.push({ accountCode: '1020', debit: giftAmount, description: 'Gift card redeemed' });
        if (otherAmount > 0) lines.push({ accountCode: '1000', debit: otherAmount, description: 'Other tender' });

        lines.push({ accountCode: '4000', credit: subtotal, description: 'Sales revenue' });
        if (tax > 0) lines.push({ accountCode: '2100', credit: tax, description: 'VAT collected' });

        lines.push({ accountCode: '5000', debit: cogs, description: 'Cost of goods sold' });
        lines.push({ accountCode: '1200', credit: cogs, description: 'Inventory reduction' });

        await journal.postFromEvent(tx, {
          entryDate,
          description: `Sale ${p.saleNumber} at ${p.storeLocation}`,
          referenceType: 'sale',
          referenceId: p.saleId,
          lines,
        });
      });

      logger.info('Recorded sale in ledger', { saleNumber: p.saleNumber, gross, cogs });
    } catch (err) {
      logger.error('Failed to record sale', { saleNumber: p.saleNumber, err: String(err) });
      throw err;
    }
  });
}
