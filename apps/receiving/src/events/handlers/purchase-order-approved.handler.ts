import { EventBus } from '@mfa/event-bus';
import { Logger } from '@mfa/logger';

export async function registerPoApprovedHandler(bus: EventBus, logger: Logger): Promise<void> {
  await bus.subscribe('procurement.purchase-order.approved', async (event) => {
    logger.info('Purchase order approved — ready to expect delivery', {
      purchaseOrderId: event.aggregateId,
      supplierId: (event.payload as { supplierId?: string }).supplierId,
    });
  });
}
