import { EventBus } from '@mfa/event-bus';
import { Logger } from '@mfa/logger';
import { ReliabilityService } from '../../modules/reliability/reliability.service';

interface GrnCompletedPayload {
  grnId: string;
  supplierId: string;
  poId: string;
  poExpectedDate: string;
  grnDate: string;
  shortages: number;
  damages: number;
}

export async function registerGrnCompletedHandler(
  bus: EventBus,
  logger: Logger,
  service: ReliabilityService,
): Promise<void> {
  await bus.subscribe<GrnCompletedPayload>('receiving.grn.completed', async (event) => {
    const p = event.payload;
    try {
      const onTime = new Date(p.grnDate) <= new Date(p.poExpectedDate);
      await service.recordDelivery({
        supplierId: p.supplierId,
        deliveredAt: p.grnDate,
        onTime,
        hadShortage: p.shortages > 0,
        hadDamage: p.damages > 0,
      });
      logger.info('Reliability updated', { supplierId: p.supplierId, grnId: p.grnId, onTime });
    } catch (err) {
      logger.error('Failed to update reliability', { grnId: p.grnId, err: String(err) });
      throw err;
    }
  });
}
