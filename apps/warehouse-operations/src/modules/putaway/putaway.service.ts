import { PutawayRepository } from './putaway.repository';
import { LocationRepository } from '../location/location.repository';
import { OutboxRepository } from '../../shared/outbox.repository';
import { PutawayTask, TaskStatus } from './putaway.types';
import { ConflictError, NotFoundError } from '@mfa/errors';

export class PutawayService {
  constructor(
    private readonly repo = new PutawayRepository(),
    private readonly locations = new LocationRepository(),
    private readonly outbox = new OutboxRepository(),
  ) {}

  async assignBinAndCreateTask(input: {
    goodsReceivedNoteId: string;
    productCode: string;
    productName: string;
    quantity: number;
  }): Promise<PutawayTask> {
    return this.repo.withTransaction(async (tx) => {
      // Find best bin (least loaded that can fit the quantity)
      const bin = await this.locations.findAvailableBin(tx, input.quantity);
      if (!bin) throw new ConflictError(`No location has capacity for ${input.quantity} units`);

      // Reserve the space
      await this.locations.incrementUsed(tx, bin.code, input.quantity);

      // Create the task
      const task = await this.repo.create(tx, {
        goodsReceivedNoteId: input.goodsReceivedNoteId,
        productCode: input.productCode,
        productName: input.productName,
        quantity: input.quantity,
        assignedBin: bin.code,
      });

      await this.outbox.enqueue(tx, {
        eventType: 'warehouse.putaway.assigned',
        aggregateId: task.id,
        payload: {
          taskId: task.id,
          goodsReceivedNoteId: input.goodsReceivedNoteId,
          productCode: input.productCode,
          quantity: input.quantity,
          assignedBin: bin.code,
        },
      });

      return task;
    });
  }

  async completeTask(id: string): Promise<PutawayTask> {
    return this.repo.withTransaction(async (tx) => {
      const task = await this.repo.findById(id);
      if (!task) throw new NotFoundError(`Putaway task ${id} not found`);
      if (task.status !== 'pending') throw new ConflictError(`Task already ${task.status}`);

      const completed = await this.repo.complete(tx, id);

      await this.outbox.enqueue(tx, {
        eventType: 'warehouse.putaway.completed',
        aggregateId: id,
        payload: {
          taskId: id,
          productCode: task.productCode,
          quantity: task.quantity,
          assignedBin: task.assignedBin,
        },
      });

      return completed;
    });
  }

  async list(status?: TaskStatus): Promise<PutawayTask[]> {
    return this.repo.list(status);
  }

  async get(id: string): Promise<PutawayTask> {
    const t = await this.repo.findById(id);
    if (!t) throw new NotFoundError(`Putaway task ${id} not found`);
    return t;
  }
}
