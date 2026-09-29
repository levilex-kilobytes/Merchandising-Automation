import { EventBus } from '@mfa/event-bus';
import { Logger } from '@mfa/logger';
import { JournalService } from '../../modules/journal/journal.service';
import { APService } from '../../modules/ap/ap.service';

interface Payload {
  goodsReceivedNoteId: string;
  supplierId: string;
  supplierName?: string;
  lines?: Array<{
    productCode: string;
    productName: string;
    receivedQty: number;
    unitCost: number;
  }>;
}

export async function registerGRNHandler(
  bus: EventBus,
  logger: Logger,
  journal: JournalService,
  ap: APService,
): Promise<void> {
  await bus.subscribe<Payload>('receiving.goods-received-note.completed', async (event) => {
    const p = event.payload;
    const lines = (p.lines ?? []).filter((l) => l.receivedQty > 0);

    if (lines.length === 0) {
      logger.warn('GRN completed with no received lines', { grnId: p.goodsReceivedNoteId });
      return;
    }

    const totalValue = lines.reduce((sum, l) => sum + l.receivedQty * l.unitCost, 0);

    try {
      await ap.createForGRN(
        // AP service opens its own transaction via withTransaction, but we pass a fake tx proxy
        // For simplicity here, use a real pool client
        (await (await import('../../config/database')).pool.connect()) as never,
        {
          supplierId: p.supplierId,
          supplierName: p.supplierName ?? 'Unknown',
          grnId: p.goodsReceivedNoteId,
          amount: totalValue,
          unitCostByProduct: Object.fromEntries(lines.map((l) => [l.productCode, l.unitCost])),
          lines: lines.map((l) => ({
            productCode: l.productCode,
            receivedQty: l.receivedQty,
            unitCost: l.unitCost,
          })),
        },
      );
      logger.info('Recorded GRN in ledger', { grnId: p.goodsReceivedNoteId, totalValue });
    } catch (err) {
      logger.error('Failed to record GRN', { grnId: p.goodsReceivedNoteId, err: String(err) });
      throw err;
    }
  });
}
