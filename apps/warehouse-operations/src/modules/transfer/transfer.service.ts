import { TransferRepository } from './transfer.repository';
import { OutboxRepository } from '../../shared/outbox.repository';
import { Transfer, CreateTransferDto, TransferStatus } from './transfer.types';
import { ConflictError, NotFoundError } from '@mfa/errors';

export class TransferService {
  constructor(
    private readonly repo = new TransferRepository(),
    private readonly outbox = new OutboxRepository(),
  ) {}

  async create(input: CreateTransferDto): Promise<Transfer> {
    if (input.fromLocation === input.toLocation) {
      throw new ConflictError('Source and destination must differ');
    }
    if (!input.lines.length) {
      throw new ConflictError('Transfer must have at least one line');
    }

    return this.repo.withTransaction(async (tx) => {
      const transfer = await this.repo.create(tx, {
        fromLocation: input.fromLocation,
        toLocation: input.toLocation,
        notes: input.notes,
      });

      for (const line of input.lines) {
        await this.repo.addLine(tx, transfer.id, line);
      }

      await this.outbox.enqueue(tx, {
        eventType: 'warehouse.transfer.created',
        aggregateId: transfer.id,
        payload: {
          transferId: transfer.id,
          fromLocation: transfer.fromLocation,
          toLocation: transfer.toLocation,
          lineCount: input.lines.length,
        },
      });

      return this.repo.findById(transfer.id) as Promise<Transfer>;
    });
  }

  async dispatch(id: string): Promise<Transfer> {
    const transfer = await this.get(id);
    if (transfer.status !== 'draft') {
      throw new ConflictError(`Transfer already ${transfer.status}`);
    }
    return this.repo.withTransaction(async (tx) => {
      const updated = await this.repo.updateStatus(tx, id, 'dispatched', { dispatchedAt: new Date() });
      await this.outbox.enqueue(tx, {
        eventType: 'warehouse.transfer.dispatched',
        aggregateId: id,
        payload: {
          transferId: id,
          fromLocation: transfer.fromLocation,
          toLocation: transfer.toLocation,
          lines: transfer.lines?.map((l) => ({ productCode: l.productCode, quantity: l.quantity })),
        },
      });
      return updated;
    });
  }

  async receive(id: string): Promise<Transfer> {
    const transfer = await this.get(id);
    if (transfer.status !== 'dispatched') {
      throw new ConflictError(`Transfer must be dispatched first`);
    }
    return this.repo.withTransaction(async (tx) => {
      const updated = await this.repo.updateStatus(tx, id, 'received', { receivedAt: new Date() });
      await this.outbox.enqueue(tx, {
        eventType: 'warehouse.transfer.received',
        aggregateId: id,
        payload: {
          transferId: id,
          fromLocation: transfer.fromLocation,
          toLocation: transfer.toLocation,
          lines: transfer.lines?.map((l) => ({ productCode: l.productCode, quantity: l.quantity })),
        },
      });
      return updated;
    });
  }

  async list(status?: TransferStatus): Promise<Transfer[]> {
    return this.repo.list(status);
  }

  async get(id: string): Promise<Transfer> {
    const t = await this.repo.findById(id);
    if (!t) throw new NotFoundError(`Transfer ${id} not found`);
    return t;
  }
}
