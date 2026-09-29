import { EventBus } from '@mfa/event-bus';
import { Logger } from '@mfa/logger';
import { RegisterService } from '../../modules/register/register.service';

interface SaleCompletedPayload {
  saleId: string;
  saleNumber: string;
  storeLocation: string;
  grandTotal: number;
  completedAt: string;
}

export async function registerSaleCompletedHandler(
  bus: EventBus,
  logger: Logger,
  service: RegisterService,
): Promise<void> {
  await bus.subscribe<SaleCompletedPayload>('retail-sales.sale.completed', async (event) => {
    const p = event.payload;
    const registerCode = (p as { registerCode?: string }).registerCode ?? 'POS-01';
    const businessDate = (p.completedAt ?? new Date().toISOString()).slice(0, 10);

    try {
      await service.recordSale({
        storeLocation: p.storeLocation,
        registerCode,
        businessDate,
        amount: p.grandTotal,
      });
      logger.info('Recorded sale into register session', {
        saleNumber: p.saleNumber,
        registerCode,
        amount: p.grandTotal,
      });
    } catch (err) {
      logger.error('Failed to record sale for audit', { saleNumber: p.saleNumber, err: String(err) });
      throw err;
    }
  });
}
