import { EventBus } from '@mfa/event-bus';
import { Logger } from '@mfa/logger';

interface POApprovedPayload {
  poId: string;
  supplierId: string;
  supplierName: string;
  lines?: Array<{ productCode: string; orderedQty: number; unitCost: number }>;
}

export async function registerPOApprovedHandler(bus: EventBus, logger: Logger): Promise<void> {
  await bus.subscribe<POApprovedPayload>('procurement.po.approved', async (event) => {
    const p = event.payload;
    logger.info('PO approved — on-order tracking', {
      poId: p.poId,
      lineCount: p.lines?.length ?? 0,
    });
    // TODO: increment on_order for each line
  });
}
