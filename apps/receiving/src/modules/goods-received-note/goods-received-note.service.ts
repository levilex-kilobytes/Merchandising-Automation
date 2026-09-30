import { GoodsReceivedNoteRepository } from './goods-received-note.repository';
import { OutboxRepository } from '../../shared/outbox.repository';
import { ProcurementClient } from '../../grpc/procurement.client';
import { GoodsReceivedNote, CreateGoodsReceivedNoteDto, RecordLineDto, ListGRNQueryDto } from './goods-received-note.types';
import { ConflictError, NotFoundError } from '@mfa/errors';

export class GoodsReceivedNoteService {
  constructor(
    private readonly repo = new GoodsReceivedNoteRepository(),
    private readonly outbox = new OutboxRepository(),
    private readonly procurement = new ProcurementClient(),
  ) {}

  async createGoodsReceivedNote(input: CreateGoodsReceivedNoteDto): Promise<GoodsReceivedNote> {
    const po = await this.procurement.getPurchaseOrder(input.purchaseOrderId).catch(() => null);
    if (!po) throw new NotFoundError(`PurchaseOrder ${input.purchaseOrderId} not found`);

    if (po.status !== 'approved' && po.status !== 'sent' && po.status !== 'received') {
      throw new ConflictError(`Cannot receive goods for purchase order in status ${po.status}`);
    }

    const items = await this.procurement.getPurchaseOrderExpectedItems(input.purchaseOrderId);
    if (!items.length) throw new ConflictError('Purchase order has no line items');

    return this.repo.withTransaction(async (tx) => {
      const grn = await this.repo.create(tx, {
        purchaseOrderId: input.purchaseOrderId,
        supplierId: po.supplier_id,
        supplierName: po.supplier_name ?? 'Unknown',
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
        eventType: 'receiving.goods-received-note.created',
        aggregateId: grn.id,
        payload: { goodsReceivedNoteId: grn.id, purchaseOrderId: grn.purchaseOrderId, lineCount: items.length },
      });

      return this.repo.findById(grn.id, tx) as Promise<GoodsReceivedNote>;
    });
  }

  async recordGoodsReceivedNoteLine(goodsReceivedNoteId: string, input: RecordLineDto): Promise<GoodsReceivedNote> {
    const grn = await this.getGoodsReceivedNote(goodsReceivedNoteId);
    if (grn.status !== 'draft') throw new ConflictError(`Cannot modify GoodsReceivedNote in status ${grn.status}`);

    return this.repo.withTransaction(async (tx) => {
      await this.repo.recordGoodsReceivedNoteLine(tx, goodsReceivedNoteId, input.productCode, {
        receivedQty: input.receivedQty,
        damagedQty: input.damagedQty,
        condition: input.condition,
        notes: input.notes,
      });

      const updated = await this.repo.findById(goodsReceivedNoteId, tx);

      if (updated?.lines) {
        let shortages = 0;
        let overages = 0;
        let damages = 0;

        for (const line of updated.lines) {
          if (line.receivedQty < line.orderedQty) shortages += line.orderedQty - line.receivedQty;
          if (line.receivedQty > line.orderedQty) overages += line.receivedQty - line.orderedQty;
          damages += line.damagedQty;
        }

        await this.repo.updateDiscrepancies(tx, goodsReceivedNoteId, { shortages, overages, damages });
      }

      return (await this.repo.findById(goodsReceivedNoteId, tx)) as GoodsReceivedNote;
    });
  }

  async completeGoodsReceivedNote(goodsReceivedNoteId: string): Promise<GoodsReceivedNote> {
    const grn = await this.getGoodsReceivedNote(goodsReceivedNoteId);
    if (grn.status !== 'draft') throw new ConflictError(`GoodsReceivedNote already ${grn.status}`);

    return this.repo.withTransaction(async (tx) => {
      const completed = await this.repo.complete(tx, goodsReceivedNoteId);

      await this.outbox.enqueue(tx, {
        eventType: 'receiving.goods-received-note.completed',
        aggregateId: goodsReceivedNoteId,
        payload: {
          goodsReceivedNoteId,
          purchaseOrderId: grn.purchaseOrderId,
          supplierId: grn.supplierId,
          supplierName: grn.supplierName,
          grnDate: new Date().toISOString(),
          shortages: grn.shortages,
          damages: grn.damages,
          lines: (grn.lines ?? []).map((l) => ({
            productCode: l.productCode,
            productName: l.productName,
            receivedQty: l.receivedQty,
            unitCost: l.unitCost,
          })),
        },
      });

      return completed;
    });
  }

  async getGoodsReceivedNote(id: string): Promise<GoodsReceivedNote> {
    const grn = await this.repo.findById(id);
    if (!grn) throw new NotFoundError(`GoodsReceivedNote ${id} not found`);
    return grn;
  }

  async listGoodsReceivedNotes(filter: ListGRNQueryDto): Promise<GoodsReceivedNote[]> {
    return this.repo.list(filter);
  }
}
