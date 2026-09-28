import { GRNRepository } from './grn.repository';
import { OutboxRepository } from '../../shared/outbox.repository';
import { ProcurementClient } from '../../grpc/procurement.client';
import { GRN, CreateGRNDto, RecordLineDto, ListGRNQueryDto } from './grn.types';
import { ConflictError, NotFoundError } from '@mfa/errors';

export class GRNService {
  constructor(
    private readonly repo = new GRNRepository(),
    private readonly outbox = new OutboxRepository(),
    private readonly procurement = new ProcurementClient(),
  ) {}

  async createGRN(input: CreateGRNDto): Promise<GRN> {
    const po = await this.procurement.getPurchaseOrder(input.poId).catch(() => null);
    if (!po) throw new NotFoundError(`PurchaseOrder ${input.poId} not found`);

    if (po.status !== 'approved' && po.status !== 'sent' && po.status !== 'received') {
      throw new ConflictError(`Cannot receive goods for PO in status ${po.status}`);
    }

    const items = await this.procurement.getPOExpectedItems(input.poId);
    if (!items.length) throw new ConflictError('PO has no line items');

    return this.repo.withTransaction(async (tx) => {
      const grn = await this.repo.create(tx, {
        poId: input.poId,
        supplierId: po.supplier_id,
        supplierName: 'Unknown',
        notes: input.notes,
      });

      for (const item of items) {
        await this.repo.addLine(tx, grn.id, {
          productCode: item.product_code,
          productName: item.product_code,
          orderedQty: item.ordered_qty,
          unitCost: item.unit_cost,
        });
      }

      await this.outbox.enqueue(tx, {
        eventType: 'receiving.grn.created',
        aggregateId: grn.id,
        payload: { grnId: grn.id, poId: grn.poId, lineCount: items.length },
      });

      return this.repo.findById(grn.id, tx) as Promise<GRN>;
    });
  }

  async recordLine(grnId: string, input: RecordLineDto): Promise<GRN> {
    const grn = await this.getGRN(grnId);
    if (grn.status !== 'draft') throw new ConflictError(`Cannot modify GRN in status ${grn.status}`);

    return this.repo.withTransaction(async (tx) => {
      await this.repo.recordLine(tx, grnId, input.productCode, {
        receivedQty: input.receivedQty,
        damagedQty: input.damagedQty,
        condition: input.condition,
        notes: input.notes,
      });

      const updated = await this.repo.findById(grnId, tx);

      if (updated?.lines) {
        let shortages = 0;
        let overages = 0;
        let damages = 0;

        for (const line of updated.lines) {
          if (line.receivedQty < line.orderedQty) shortages += line.orderedQty - line.receivedQty;
          if (line.receivedQty > line.orderedQty) overages += line.receivedQty - line.orderedQty;
          damages += line.damagedQty;
        }

        await this.repo.updateDiscrepancies(tx, grnId, { shortages, overages, damages });
      }

      return (await this.repo.findById(grnId, tx)) as GRN;
    });
  }

  async completeGRN(grnId: string): Promise<GRN> {
    const grn = await this.getGRN(grnId);
    if (grn.status !== 'draft') throw new ConflictError(`GRN already ${grn.status}`);

    return this.repo.withTransaction(async (tx) => {
      const completed = await this.repo.complete(tx, grnId);

      await this.outbox.enqueue(tx, {
        eventType: 'receiving.grn.completed',
        aggregateId: grnId,
        payload: {
          grnId,
          poId: grn.poId,
          supplierId: grn.supplierId,
          grnDate: new Date().toISOString(),
          shortages: grn.shortages,
          damages: grn.damages,
          lines: (grn.lines ?? []).map((l) => ({
            productCode: l.productCode,
            receivedQty: l.receivedQty,
          })),
        },
      });

      return completed;
    });
  }

  async getGRN(id: string): Promise<GRN> {
    const grn = await this.repo.findById(id);
    if (!grn) throw new NotFoundError(`GRN ${id} not found`);
    return grn;
  }

  async listGRNs(filter: ListGRNQueryDto): Promise<GRN[]> {
    return this.repo.list(filter);
  }
}
