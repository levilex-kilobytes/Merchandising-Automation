import { EventBus } from '@mfa/event-bus';
import { Logger } from '@mfa/logger';
import { PutawayService } from '../../modules/putaway/putaway.service';

interface Payload {
  goodsReceivedNoteId: string;
  purchaseOrderId: string;
  supplierId: string;
  lines?: Array<{
    productCode: string;
    productName: string;
    receivedQty: number;
  }>;
}

export async function registerGoodsReceivedNoteCompletedHandler(
  bus: EventBus,
  logger: Logger,
  service: PutawayService,
): Promise<void> {
  await bus.subscribe<Payload>('receiving.goods-received-note.completed', async (event) => {
    const p = event.payload;
    logger.info('GRN completed — creating putaway tasks', { goodsReceivedNoteId: p.goodsReceivedNoteId });

    for (const line of p.lines ?? []) {
      if (line.receivedQty <= 0) continue;
      try {
        const task = await service.assignBinAndCreateTask({
          goodsReceivedNoteId: p.goodsReceivedNoteId,
          productCode: line.productCode,
          productName: line.productName,
          quantity: line.receivedQty,
        });
        logger.info('Putaway task created', { taskId: task.id, productCode: line.productCode, assignedBin: task.assignedBin });
      } catch (err) {
        logger.error('Failed to create putaway task', { productCode: line.productCode, err: String(err) });
      }
    }
  });
}
