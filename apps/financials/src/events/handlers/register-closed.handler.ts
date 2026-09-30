import { EventBus } from '@mfa/event-bus';
import { Logger } from '@mfa/logger';
import { JournalService } from '../../modules/journal/journal.service';
import { withTransaction } from '../../config/database';

interface Payload {
  registerSessionId: string;
  registerCode: string;
  storeLocation: string;
  businessDate: string;
  expectedTotal: number;
  countedTotal: number;
  difference: number;
  signedOffBy: string;
  explanation: string | null;
  closedAt: string;
}

export async function registerRegisterClosedHandler(
  bus: EventBus,
  logger: Logger,
  journal: JournalService,
): Promise<void> {
  await bus.subscribe<Payload>('sales-audit.register.closed', async (event) => {
    const p = event.payload;
    if (Math.abs(p.difference) < 0.01) {
      logger.info('Register closed balanced, no variance entry', { registerCode: p.registerCode });
      return;
    }

    const abs = Math.abs(Number(p.difference.toFixed(2)));
    const entryDate = (p.closedAt ?? new Date().toISOString()).slice(0, 10);

    try {
      await withTransaction(async (tx) => {
        if (p.difference < 0) {
          await journal.postFromEvent(tx, {
            entryDate,
            description: `Cash shortage — ${p.registerCode} on ${p.businessDate}`,
            referenceType: 'register_close',
            referenceId: p.registerSessionId,
            lines: [
              { accountCode: '5900', debit: abs, description: 'Cash over/short expense' },
              { accountCode: '1000', credit: abs, description: 'Cash drawer reduction' },
            ],
          });
        } else {
          await journal.postFromEvent(tx, {
            entryDate,
            description: `Cash overage — ${p.registerCode} on ${p.businessDate}`,
            referenceType: 'register_close',
            referenceId: p.registerSessionId,
            lines: [
              { accountCode: '1000', debit: abs, description: 'Cash drawer increase' },
              { accountCode: '5900', credit: abs, description: 'Cash over/short income' },
            ],
          });
        }
      });
      logger.info('Recorded register variance in ledger', { registerCode: p.registerCode, difference: p.difference });
    } catch (err) {
      logger.error('Failed to record register variance', { registerCode: p.registerCode, err: String(err) });
      throw err;
    }
  });
}
