import { EventBus } from '@mfa/event-bus';
import { Logger } from '@mfa/logger';
import { PurchaseOrderService } from '../../modules/purchase-order/purchase-order.service';

interface GrnCompletedPayload {
  grnId: string;
  poId: string;
  supplierId: string;
  lines?: Array<{ productCode: string; receivedQty: number }>;
}

export async function registerGrnCompletedHandler(
  bus: EventBus,
  logger: Logger,
  service: PurchaseOrderService,
): Promise<void> {
  await bus.subscribe<GrnCompletedPayload>('receiving.grn.completed', async (event) => {
    const p = event.payload;
    try {
      if (p.lines) {
        for (const line of p.lines) {
          await service.recordReceipt(p.poId, line.productCode, line.receivedQty);
        }
      }
      logger.info('PO receipt recorded', { poId: p.poId, grnId: p.grnId });
    } catch (err) {
      logger.error('Failed to record PO receipt', { poId: p.poId, err: String(err) });
      throw err;
    }
  });
}
