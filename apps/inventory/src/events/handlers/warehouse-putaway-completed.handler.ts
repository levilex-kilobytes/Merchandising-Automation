import { EventBus } from '@mfa/event-bus';
import { Logger } from '@mfa/logger';
import { StockService } from '../../modules/stock/stock.service';
import { config } from '../../config';

interface PutawayCompletedPayload {
  taskId: string;
  productCode: string;
  quantity: number;
  assignedBin: string;
}

export async function registerPutawayCompletedHandler(
  bus: EventBus,
  logger: Logger,
  service: StockService,
): Promise<void> {
  await bus.subscribe<PutawayCompletedPayload>('warehouse.putaway.completed', async (event) => {
    const p = event.payload;
    try {
      await service.moveStock({
        productCode: p.productCode,
        fromLocation: config.DEFAULT_LOCATION_CODE,
        toLocation: p.assignedBin,
        quantity: p.quantity,
        referenceId: p.taskId,
      });
      logger.info('Stock moved to bin', {
        productCode: p.productCode,
        quantity: p.quantity,
        bin: p.assignedBin,
      });
    } catch (err) {
      logger.error('Failed to move stock to bin', {
        taskId: p.taskId,
        productCode: p.productCode,
        err: String(err),
      });
      throw err;
    }
  });
}
