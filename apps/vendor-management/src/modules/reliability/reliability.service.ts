import { SupplierReliabilityRepository } from './reliability.repository';
import { OutboxRepository } from '../../shared/outbox.repository';
import { SupplierReliability, RecordDeliveryDto } from './reliability.types';
import { NotFoundError } from '@mfa/errors';

export class ReliabilityService {
  constructor(
    private readonly repo = new SupplierReliabilityRepository(),
    private readonly outbox = new OutboxRepository(),
  ) {}

  async recordDelivery(input: RecordDeliveryDto): Promise<SupplierReliability> {
    return this.repo.withTransaction(async (tx) => {
      const reliability = await this.repo.recordDelivery(tx, {
        supplierId: input.supplierId,
        onTime: input.onTime,
        hadShortage: input.hadShortage,
        hadDamage: input.hadDamage,
      });
      await this.outbox.enqueue(tx, {
        eventType: 'vendor.supplier.reliability.updated',
        aggregateId: input.supplierId,
        payload: {
          supplierId: input.supplierId,
          periodStart: reliability.periodStart,
          periodEnd: reliability.periodEnd,
          ordersTotal: reliability.ordersTotal,
          onTimeRate: reliability.onTimeRate,
          qualityRate: reliability.qualityRate,
        },
      });
      return reliability;
    });
  }

  async listBySupplier(supplierId: string): Promise<SupplierReliability[]> {
    return this.repo.listBySupplier(supplierId);
  }

  async getCurrent(supplierId: string): Promise<SupplierReliability> {
    const current = await this.repo.getCurrent(supplierId);
    if (!current) throw new NotFoundError(`No reliability data for supplier ${supplierId}`);
    return current;
  }
}
