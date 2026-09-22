import { StockRepository } from './stock.repository';
import { OutboxRepository } from '../../shared/outbox.repository';
import {
  StockItem,
  StockMovement,
  AdjustmentDto,
  ListStockQueryDto,
  ReceiveStockInput,
  ReserveStockInput,
} from './stock.types';
import { NotFoundError, ConflictError } from '@mfa/errors';
import { config } from '../../config';

export class StockService {
  constructor(
    private readonly repo = new StockRepository(),
    private readonly outbox = new OutboxRepository(),
  ) {}

  async receiveStock(input: ReceiveStockInput): Promise<StockItem> {
    return this.repo.withTransaction(async (tx) => {
      const item = await this.repo.upsertStockItem(tx, {
        productCode: input.productCode,
        productName: input.productName,
        locationCode: input.locationCode,
        unitCost: input.unitCost,
        lowStockThreshold: config.LOW_STOCK_THRESHOLD,
      });

      const updated = await this.repo.incrementOnHand(tx, item.id, input.quantity);

      await this.repo.recordMovement(tx, {
        productCode: input.productCode,
        locationCode: input.locationCode,
        movementType: 'received',
        quantity: input.quantity,
        referenceId: input.referenceId,
        referenceType: input.referenceType,
      });

      await this.outbox.enqueue(tx, {
        eventType: 'inventory.stock.received',
        aggregateId: item.id,
        payload: {
          productCode: item.productCode,
          locationCode: item.locationCode,
          quantity: input.quantity,
          newOnHand: updated.onHand,
          referenceId: input.referenceId,
        },
      });

      return updated;
    });
  }

  async sellStock(
    productCode: string,
    locationCode: string,
    quantity: number,
    referenceId: string,
  ): Promise<StockItem> {
    return this.repo.withTransaction(async (tx) => {
      const item = await this.repo.findByProductAndLocation(productCode, locationCode, tx);
      if (!item) throw new NotFoundError(`Stock item ${productCode} @ ${locationCode} not found`);

      const updated = await this.repo.incrementOnHand(tx, item.id, -quantity);

      await this.repo.recordMovement(tx, {
        productCode,
        locationCode,
        movementType: 'sold',
        quantity: -quantity,
        referenceId,
        referenceType: 'sale',
      });

      await this.outbox.enqueue(tx, {
        eventType: 'inventory.stock.sold',
        aggregateId: item.id,
        payload: {
          productCode,
          locationCode,
          quantity,
          newOnHand: updated.onHand,
          referenceId,
        },
      });

      if (updated.available <= updated.lowStockThreshold) {
        await this.outbox.enqueue(tx, {
          eventType: 'inventory.stock.low',
          aggregateId: item.id,
          payload: {
            productCode,
            locationCode,
            available: updated.available,
            threshold: updated.lowStockThreshold,
          },
        });
      }

      return updated;
    });
  }

  async reserveStock(input: ReserveStockInput): Promise<StockItem> {
    return this.repo.withTransaction(async (tx) => {
      const item = await this.repo.findByProductAndLocation(input.productCode, input.locationCode, tx);
      if (!item) throw new NotFoundError(`Stock item ${input.productCode} @ ${input.locationCode} not found`);

      if (item.available < input.quantity) {
        throw new ConflictError(
          `Insufficient stock: available ${item.available}, requested ${input.quantity}`,
        );
      }

      await tx.query(
        `INSERT INTO reservations (product_code, location_code, quantity, reference_id)
         VALUES ($1, $2, $3, $4)`,
        [input.productCode, input.locationCode, input.quantity, input.referenceId],
      );

      const updated = await this.repo.incrementAllocated(tx, item.id, input.quantity);

      await this.repo.recordMovement(tx, {
        productCode: input.productCode,
        locationCode: input.locationCode,
        movementType: 'reserved',
        quantity: input.quantity,
        referenceId: input.referenceId,
        referenceType: 'reservation',
      });

      return updated;
    });
  }

  async releaseReservation(
    productCode: string,
    locationCode: string,
    quantity: number,
    referenceId: string,
  ): Promise<StockItem> {
    return this.repo.withTransaction(async (tx) => {
      const item = await this.repo.findByProductAndLocation(productCode, locationCode, tx);
      if (!item) throw new NotFoundError(`Stock item ${productCode} @ ${locationCode} not found`);

      await tx.query(
        `UPDATE reservations SET status = 'released', released_at = NOW()
         WHERE product_code = $1 AND location_code = $2 AND reference_id = $3 AND status = 'active'`,
        [productCode, locationCode, referenceId],
      );

      const updated = await this.repo.incrementAllocated(tx, item.id, -quantity);

      await this.repo.recordMovement(tx, {
        productCode,
        locationCode,
        movementType: 'released',
        quantity: -quantity,
        referenceId,
        referenceType: 'reservation',
      });

      return updated;
    });
  }

  async adjustStock(input: AdjustmentDto): Promise<StockItem> {
    return this.repo.withTransaction(async (tx) => {
      const item = await this.repo.findByProductAndLocation(input.productCode, input.locationCode, tx);
      if (!item) throw new NotFoundError(`Stock item ${input.productCode} @ ${input.locationCode} not found`);

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
