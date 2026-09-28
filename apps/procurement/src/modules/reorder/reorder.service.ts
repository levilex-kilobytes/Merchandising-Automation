import { ReorderRepository } from './reorder.repository';
import { OutboxRepository } from '../../shared/outbox.repository';
import { VendorClient } from '../../grpc/vendor.client';
import { ReorderSuggestion, CreateSuggestionInput } from './reorder.types';
import { ConflictError, NotFoundError } from '@mfa/errors';

const REORDER_MULTIPLIER = 2;

export class ReorderService {
  constructor(
    private readonly repo = new ReorderRepository(),
    private readonly outbox = new OutboxRepository(),
    private readonly vendor = new VendorClient(),
  ) {}

  async createSuggestion(input: CreateSuggestionInput): Promise<ReorderSuggestion> {
    const existing = await this.repo.findActiveByProduct(input.productCode);
    if (existing) return existing;

    const suppliers = await this.vendor.listSuppliersForProduct(input.productCode);
    if (!suppliers.length) {
      throw new NotFoundError(`No supplier sells product ${input.productCode}`);
    }

    const best = suppliers[0];

    // Fetch the supplier name in a second call (proto doesn't return it yet)
    let supplierName = 'Unknown';
    try {
      const supplier = await this.vendor.getSupplier(best.supplierId);
      supplierName = supplier.name;
    } catch {
      // Keep fallback if the lookup fails
    }

    const deficit = input.threshold - input.currentStock;
    const suggestedQty = Math.max(
      best.minOrderQty,
      Math.ceil(deficit * REORDER_MULTIPLIER),
    );

    return this.repo.withTransaction(async (tx) => {
      const suggestion = await this.repo.create(tx, {
        productCode: best.productCode,
        productName: best.productName,
        supplierId: best.supplierId,
        supplierName,
        suggestedQuantity: suggestedQty,
        unitCost: best.unitCost,
        currency: best.currency,
        leadTimeDays: best.leadTimeDays,
        reason: `Stock at ${input.currentStock}, threshold ${input.threshold}`,
      });

      await this.outbox.enqueue(tx, {
        eventType: 'procurement.reorder.suggested',
        aggregateId: suggestion.id,
        payload: {
          suggestionId: suggestion.id,
          productCode: suggestion.productCode,
          supplierId: suggestion.supplierId,
          suggestedQuantity: suggestion.suggestedQuantity,
        },
      });

      return suggestion;
    });
  }

  async listSuggestions(status?: string): Promise<ReorderSuggestion[]> {
    return this.repo.list(status);
  }

  async getSuggestion(id: string): Promise<ReorderSuggestion> {
    const s = await this.repo.findById(id);
    if (!s) throw new NotFoundError(`Reorder suggestion ${id} not found`);
    return s;
  }

  async dismiss(id: string): Promise<ReorderSuggestion> {
    return this.repo.withTransaction(async (tx) => {
      const s = await this.repo.findById(id);
      if (!s) throw new NotFoundError(`Reorder suggestion ${id} not found`);
      if (s.status !== 'pending') {
        throw new ConflictError(`Cannot dismiss suggestion in status ${s.status}`);
      }
      return this.repo.updateStatus(tx, id, 'dismissed');
    });
  }

  async markConverted(id: string, poId: string): Promise<ReorderSuggestion> {
    return this.repo.withTransaction(async (tx) => {
      return this.repo.updateStatus(tx, id, 'converted', poId);
    });
  }
}
