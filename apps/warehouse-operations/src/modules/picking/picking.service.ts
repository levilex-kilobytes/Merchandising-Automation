import { PickTaskRepository } from './picking.repository';
import { OutboxRepository } from '../../shared/outbox.repository';
import { PickTask, CreatePickTaskDto, PickTaskStatus } from './picking.types';
import { ConflictError, NotFoundError } from '@mfa/errors';

export class PickingService {
  constructor(
    private readonly repo = new PickTaskRepository(),
    private readonly outbox = new OutboxRepository(),
  ) {}

  async createTask(input: CreatePickTaskDto): Promise<PickTask> {
    return this.repo.withTransaction(async (tx) => {
      const task = await this.repo.create(tx, input);

      await this.outbox.enqueue(tx, {
        eventType: 'warehouse.pick.created',
        aggregateId: task.id,
        payload: {
          taskId: task.id,
          productCode: task.productCode,
          quantity: task.quantity,
          fromBin: task.fromBin,
          toLocation: task.toLocation,
        },
      });

      return task;
    });
  }

  async completeTask(id: string): Promise<PickTask> {
    return this.repo.withTransaction(async (tx) => {
      const task = await this.repo.findById(id);
      if (!task) throw new NotFoundError(`Pick task ${id} not found`);
      if (task.status !== 'pending') throw new ConflictError(`Task already ${task.status}`);

      const completed = await this.repo.complete(tx, id);

      await this.outbox.enqueue(tx, {
        eventType: 'warehouse.pick.completed',
        aggregateId: id,
        payload: {
          taskId: id,
          productCode: task.productCode,
          quantity: task.quantity,
          fromBin: task.fromBin,
          toLocation: task.toLocation,
        },
      });

      return completed;
    });
  }

  async list(status?: PickTaskStatus): Promise<PickTask[]> {
    return this.repo.list(status);
  }

  async get(id: string): Promise<PickTask> {
    const t = await this.repo.findById(id);
    if (!t) throw new NotFoundError(`Pick task ${id} not found`);
    return t;
  }
}
