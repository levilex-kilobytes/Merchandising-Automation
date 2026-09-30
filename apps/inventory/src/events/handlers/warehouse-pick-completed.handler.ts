import { EventBus } from '@mfa/event-bus';
import { Logger } from '@mfa/logger';
import { StockService } from '../../modules/stock/stock.service';

interface Payload {
  taskId: string;
  productCode: string;
  quantity: number;
  fromBin: string;
  toLocation: string;
}

export async function registerPickCompletedHandler(
  bus: EventBus,
  logger: Logger,
  service: StockService,
): Promise<void> {
  await bus.subscribe<Payload>('warehouse.pick.completed', async (event) => {
    const p = event.payload;
    try {
      await service.moveStock({
        productCode: p.productCode,
        fromLocation: p.fromBin,
        toLocation: p.toLocation,
        quantity: p.quantity,
        referenceId: p.taskId,
      });
      logger.info('Stock moved for pick', {
        productCode: p.productCode,
        quantity: p.quantity,
        from: p.fromBin,
        to: p.toLocation,
      });
    } catch (err) {
      logger.error('Failed to move stock for pick', {
        taskId: p.taskId,
        err: String(err),
      });
      throw err;
    }
  });
}
