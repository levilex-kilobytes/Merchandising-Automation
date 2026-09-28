import { EventBus } from '@mfa/event-bus';
import { Logger } from '@mfa/logger';
import { PurchaseOrderService } from '../../modules/purchase-order/purchase-order.service';

interface GrnCompletedPayload {
  goodsReceivedNoteId: string;
  purchaseOrderId: string;
  supplierId: string;
  lines?: Array<{ productCode: string; receivedQty: number }>;
}

export async function registerGrnCompletedHandler(
  bus: EventBus,
  logger: Logger,
  service: PurchaseOrderService,
): Promise<void> {
  await bus.subscribe<GrnCompletedPayload>('receiving.goods-received-note.completed', async (event) => {
    const p = event.payload;
    try {
      if (p.lines) {
        for (const line of p.lines) {
          await service.recordReceipt(p.purchaseOrderId, line.productCode, line.receivedQty);
        }
      }
      logger.info('Purchase order receipt recorded', { purchaseOrderId: p.purchaseOrderId, goodsReceivedNoteId: p.goodsReceivedNoteId });
    } catch (err) {
      logger.error('Failed to record purchase order receipt', { purchaseOrderId: p.purchaseOrderId, err: String(err) });
      throw err;
    }
  });
}
