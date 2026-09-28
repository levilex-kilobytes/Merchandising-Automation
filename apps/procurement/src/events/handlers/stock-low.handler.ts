import { EventBus } from '@mfa/event-bus';
import { Logger } from '@mfa/logger';
import { ReorderService } from '../../modules/reorder/reorder.service';
import { StockLowPayload } from '../../modules/reorder/reorder.types';

export async function registerStockLowHandler(
  bus: EventBus,
  logger: Logger,
  service: ReorderService,
): Promise<void> {
  await bus.subscribe<StockLowPayload>('inventory.stock.low', async (event) => {
    const p = event.payload;

    logger.info('Low stock detected — creating reorder suggestion', {
      productCode: p.productCode,
      available: p.available,
      threshold: p.threshold,
    });

    try {
      const suggestion = await service.createSuggestion({
        productCode: p.productCode,
        currentStock: p.available,
        threshold: p.threshold,
      });

      logger.info('Reorder suggestion ready', {
        suggestionId: suggestion.id,
        productCode: suggestion.productCode,
        supplierName: suggestion.supplierName,
        quantity: suggestion.suggestedQuantity,
      });
    } catch (err) {
      logger.error('Failed to create reorder suggestion', {
        productCode: p.productCode,
        err: String(err),
      });
      throw err;
    }
  });
}
