import { EventBus } from '@mfa/event-bus';
import { Logger } from '@mfa/logger';
import { JournalService } from '../../modules/journal/journal.service';
import { withTransaction } from '../../config/database';
import { config } from '../../config';

interface Payload {
  returnId: string;
  returnNumber: string;
  originalSaleId: string;
  storeLocation: string;
  refundTotal: number;
  lines: Array<{ productCode: string; quantity: number; refundAmount: number }>;
  completedAt: string;
}

export async function registerReturnCompletedHandler(
  bus: EventBus,
  logger: Logger,
  journal: JournalService,
): Promise<void> {
  await bus.subscribe<Payload>('retail-sales.return.completed', async (event) => {
    const p = event.payload;
    const refund = Number(p.refundTotal.toFixed(2));
    const cogs = Number((refund * config.COGS_RATIO).toFixed(2));
    const entryDate = (p.completedAt ?? new Date().toISOString()).slice(0, 10);

    try {
      await withTransaction(async (tx) => {
        await journal.postFromEvent(tx, {
          entryDate,
          description: `Return ${p.returnNumber} at ${p.storeLocation}`,
          referenceType: 'return',
          referenceId: p.returnId,
          lines: [
            { accountCode: '4100', debit: refund, description: 'Sales return — contra revenue' },
            { accountCode: '1000', credit: refund, description: 'Refund paid' },
            { accountCode: '1200', debit: cogs, description: 'Inventory restored' },
            { accountCode: '5000', credit: cogs, description: 'Reverse COGS' },
          ],
        });
      });
      logger.info('Recorded return in ledger', { returnNumber: p.returnNumber, refund });
    } catch (err) {
      logger.error('Failed to record return', { returnNumber: p.returnNumber, err: String(err) });
      throw err;
    }
  });
}
