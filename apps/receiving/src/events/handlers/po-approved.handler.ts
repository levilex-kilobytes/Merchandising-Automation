import { EventBus } from '@mfa/event-bus';
import { Logger } from '@mfa/logger';

export async function registerPoApprovedHandler(bus: EventBus, logger: Logger): Promise<void> {
  await bus.subscribe('procurement.po.approved', async (event) => {
    logger.info('PO approved — ready to expect delivery', {
      poId: event.aggregateId,
      supplierId: (event.payload as { supplierId?: string }).supplierId,
    });
  });
}
