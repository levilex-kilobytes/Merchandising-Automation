import { StockRepository } from './stock.repository';
import { OutboxRepository } from '../../shared/outbox.repository';
import { StockItem, StockMovement, AdjustmentDto, ListStockQueryDto, ReceiveStockInput } from './stock.types';
import { ConflictError, NotFoundError } from '@mfa/errors';
import { config } from '../../config';

export class StockService {
  constructor(
    private readonly repo = new StockRepository(),
    private readonly outbox = new OutboxRepository(),
  ) {}

  async receiveStock(input: ReceiveStockInput): Promise<StockItem> {
    return this.repo.withTransaction(async (tx) => {
      const item = await this.repo.upsertStockItem(tx, {
        productCode: input.productCode, productName: input.productName,
        locationCode: input.locationCode, unitCost: input.unitCost,
        lowStockThreshold: config.LOW_STOCK_THRESHOLD,
      });
      const updated = await this.repo.incrementOnHand(tx, item.id, input.quantity);
      await this.repo.recordMovement(tx, {
        productCode: input.productCode, locationCode: input.locationCode,
        movementType: 'received', quantity: input.quantity,
        referenceId: input.referenceId, referenceType: input.referenceType,
      });
      await this.outbox.enqueue(tx, {
        eventType: 'inventory.stock.received', aggregateId: item.id,
        payload: { productCode: item.productCode, locationCode: item.locationCode, quantity: input.quantity, newOnHand: updated.onHand, referenceId: input.referenceId },
      });
      return updated;
    });
  }

  async moveStock(input: {
    productCode: string;
    fromLocation: string;
    toLocation: string;
    quantity: number;
    referenceId?: string;
  }): Promise<void> {
    if (input.quantity <= 0) throw new ConflictError('Quantity must be greater than zero');
    if (input.fromLocation === input.toLocation) return;

    return this.repo.withTransaction(async (tx) => {
      const source = await this.repo.findByProductAndLocation(input.productCode, input.fromLocation, tx);
      if (!source) {
        throw new NotFoundError(`No stock for ${input.productCode} at ${input.fromLocation}`);
      }
      if (source.onHand < input.quantity) {
        throw new ConflictError(`Only ${source.onHand} units at ${input.fromLocation}, cannot move ${input.quantity}`);
      }

      await this.repo.incrementOnHand(tx, source.id, -input.quantity);
      await this.repo.recordMovement(tx, {
        productCode: input.productCode,
        locationCode: input.fromLocation,
        movementType: 'transferred',
        quantity: -input.quantity,
        referenceId: input.referenceId,
        referenceType: 'transfer',
      });

      const dest = await this.repo.upsertStockItem(tx, {
        productCode: input.productCode,
        productName: source.productName,
        locationCode: input.toLocation,
        unitCost: source.unitCost,
        lowStockThreshold: source.lowStockThreshold,
      });
      const updated = await this.repo.incrementOnHand(tx, dest.id, input.quantity);
      await this.repo.recordMovement(tx, {
        productCode: input.productCode,
        locationCode: input.toLocation,
        movementType: 'transferred',
        quantity: input.quantity,
        referenceId: input.referenceId,
        referenceType: 'transfer',
      });

      await this.outbox.enqueue(tx, {
        eventType: 'inventory.stock.moved',
        aggregateId: dest.id,
        payload: {
          productCode: input.productCode,
          fromLocation: input.fromLocation,
          toLocation: input.toLocation,
          quantity: input.quantity,
          referenceId: input.referenceId ?? null,
        },
      });

      if (updated.available <= updated.lowStockThreshold) {
        await this.outbox.enqueue(tx, {
          eventType: 'inventory.stock.low',
          aggregateId: dest.id,
          payload: {
            productCode: updated.productCode,
            locationCode: updated.locationCode,
            available: updated.available,
            threshold: updated.lowStockThreshold,
          },
        });
      }
    });
  }

  async adjustStock(input: AdjustmentDto): Promise<StockItem> {
    return this.repo.withTransaction(async (tx) => {
      const item = await this.repo.findByProductAndLocation(
        input.productCode,
        input.locationCode,
        tx,
      );
      if (!item) {
        throw new NotFoundError(
          `Stock item ${input.productCode} @ ${input.locationCode} not found`,
        );
      }

      if (item.onHand + input.delta < 0) {
        throw new ConflictError(
          `Cannot adjust by ${input.delta}: only ${item.onHand} units on hand`,
        );
      }

      const updated = await this.repo.incrementOnHand(tx, item.id, input.delta);

      await this.repo.recordMovement(tx, {
        productCode: input.productCode,
        locationCode: input.locationCode,
        movementType: 'adjusted',
        quantity: input.delta,
        notes: input.reason,
      });

      await this.outbox.enqueue(tx, {
        eventType: 'inventory.stock.adjusted',
        aggregateId: item.id,
        payload: {
          productCode: input.productCode,
          locationCode: input.locationCode,
          delta: input.delta,
          newOnHand: updated.onHand,
          reason: input.reason,
        },
      });

      if (updated.available <= updated.lowStockThreshold) {
        await this.outbox.enqueue(tx, {
          eventType: 'inventory.stock.low',
          aggregateId: item.id,
          payload: {
            productCode: updated.productCode,
            locationCode: updated.locationCode,
            available: updated.available,
            threshold: updated.lowStockThreshold,
          },
        });
      }

      return updated;
    });
  }

  async getStockItem(productCode: string, locationCode: string): Promise<StockItem> {
    const item = await this.repo.findByProductAndLocation(productCode, locationCode);
    if (!item) throw new NotFoundError(`Stock item ${productCode} @ ${locationCode} not found`);
    return item;
  }

  async listStock(filter: ListStockQueryDto): Promise<StockItem[]> {
    return this.repo.list(filter, config.LOW_STOCK_THRESHOLD);
  }

  async listMovements(productCode?: string, locationCode?: string): Promise<StockMovement[]> {
    return this.repo.listMovements(productCode, locationCode);
  }

  async listLocations(): Promise<string[]> {
    return this.repo.listLocations();
  }
}
