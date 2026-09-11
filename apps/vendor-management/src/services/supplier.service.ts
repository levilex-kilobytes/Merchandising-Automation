import { SupplierRepository } from '../repositories/supplier.repository';
import { OutboxRepository } from '../repositories/outbox.repository';
import { Supplier } from '../types/supplier';
import { CreateSupplierInput, UpdateSupplierInput, ListSuppliersQuery } from '../types/dto';
import { ConflictError, NotFoundError } from '@mfa/errors';

export class SupplierService {
  constructor(
    private readonly suppliers = new SupplierRepository(),
    private readonly outbox = new OutboxRepository(),
  ) {}

  async createSupplier(input: CreateSupplierInput): Promise<Supplier> {
    const existing = await this.suppliers.findByName(input.name);
    if (existing) throw new ConflictError(`Supplier '${input.name}' already exists`);

    return this.suppliers.withTransaction(async (tx) => {
      const supplier = await this.suppliers.create(tx, input);
      await this.outbox.enqueue(tx, {
        eventType: 'vendor.supplier.created',
        aggregateId: supplier.id,
        payload: {
          supplierId: supplier.id,
          name: supplier.name,
          paymentTerms: supplier.paymentTerms,
          defaultCurrency: supplier.defaultCurrency,
        },
      });
      return supplier;
    });
  }

  async getSupplier(id: string): Promise<Supplier> {
    const supplier = await this.suppliers.findById(id);
    if (!supplier) throw new NotFoundError(`Supplier ${id} not found`);
    return supplier;
  }

  async listSuppliers(filter: ListSuppliersQuery): Promise<Supplier[]> {
    return this.suppliers.list(filter);
  }

  async updateSupplier(id: string, patch: UpdateSupplierInput): Promise<Supplier> {
    return this.suppliers.withTransaction(async (tx) => {
      const existing = await this.suppliers.findById(id);
      if (!existing) throw new NotFoundError(`Supplier ${id} not found`);

      const updated = await this.suppliers.update(tx, id, patch);
      await this.outbox.enqueue(tx, {
        eventType: 'vendor.supplier.updated',
        aggregateId: id,
        payload: { supplierId: id, changes: patch },
      });
      return updated;
    });
  }

  async deactivateSupplier(id: string, reason: string): Promise<void> {
    await this.suppliers.withTransaction(async (tx) => {
      const existing = await this.suppliers.findById(id);
      if (!existing) throw new NotFoundError(`Supplier ${id} not found`);

      await this.suppliers.update(tx, id, { status: 'inactive' });
      await this.outbox.enqueue(tx, {
        eventType: 'vendor.supplier.deactivated',
        aggregateId: id,
        payload: { supplierId: id, reason },
      });
    });
  }
}
