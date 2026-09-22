import { EventBus } from '@mfa/event-bus';
import { Logger } from '@mfa/logger';
import { StockService } from '../../modules/stock/stock.service';
import { config } from '../../config';

interface GRNCompletedPayload {
  grnId: string;
  poId: string;
  supplierId: string;
  grnDate: string;
  shortages: number;
  damages: number;
  lines?: Array<{
    productCode: string;
    productName: string;
    receivedQty: number;
    unitCost: number;
  }>;
}

export async function registerGRNCompletedHandler(
  bus: EventBus,
  logger: Logger,
  service: StockService,
): Promise<void> {
  await bus.subscribe<GRNCompletedPayload>('receiving.grn.completed', async (event) => {
    const p = event.payload;
    try {
      if (!p.lines || p.lines.length === 0) {
        logger.warn('GRN completed without lines', { grnId: p.grnId });
        return;
      }

      for (const line of p.lines) {
        await service.receiveStock({
          productCode: line.productCode,
          productName: line.productName,
          locationCode: config.DEFAULT_LOCATION_CODE,
          quantity: line.receivedQty,
          unitCost: line.unitCost,
          referenceId: p.grnId,
          referenceType: 'grn',
        });
      }

      logger.info('Stock received from GRN', {
        grnId: p.grnId,
        lineCount: p.lines.length,
      });
    } catch (err) {
      logger.error('Failed to receive stock from GRN', { grnId: p.grnId, err: String(err) });
      throw err;
    }
  });
}
