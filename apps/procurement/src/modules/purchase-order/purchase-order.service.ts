import { PurchaseOrderRepository } from './purchase-order.repository';
import { OutboxRepository } from '../../shared/outbox.repository';
import { VendorClient } from '../../grpc/vendor.client';
import { PurchaseOrder, CreatePODto, ListPOQueryDto, ApprovePODto, CancelPODto } from './purchase-order.types';
import { ConflictError, NotFoundError, AppError } from '@mfa/errors';

export class PurchaseOrderService {
  constructor(
    private readonly repo = new PurchaseOrderRepository(),
    private readonly outbox = new OutboxRepository(),
    private readonly vendor = new VendorClient(),
  ) {}

  async createPurchaseOrder(input: CreatePODto): Promise<PurchaseOrder> {
    const supplier = await this.vendor.getSupplier(input.supplierId).catch(() => null);
    if (!supplier) throw new NotFoundError(`Supplier ${input.supplierId} not found in Vendor`);

    return this.repo.withTransaction(async (tx) => {
      const po = await this.repo.createPO(tx, {
        supplierId: supplier.id,
        supplierName: supplier.name,
        currency: input.currency,
        expectedDate: input.expectedDate,
        notes: input.notes,
      });

      for (const line of input.lines) {
        const product = await this.vendor.getSupplierProduct(input.supplierId, line.productCode).catch(() => null);
        if (!product) {
          throw new NotFoundError(
            `Product ${line.productCode} not found for supplier ${input.supplierId}`,
          );
        }

        await this.repo.createLine(tx, po.id, {
          productCode: product.product_code,
          productName: product.product_name,
          orderedQty: line.quantity,
          unitCost: product.unit_cost,
          leadTimeDays: product.lead_time_days,
        });
      }

      const totalCost = await this.repo.recalculateTotal(tx, po.id);

      await this.outbox.enqueue(tx, {
        eventType: 'procurement.po.created',
        aggregateId: po.id,
        payload: {
          poId: po.id,
          supplierId: supplier.id,
          supplierName: supplier.name,
          totalCost,
          currency: input.currency,
          lineCount: input.lines.length,
        },
      });

      return this.repo.findById(po.id, tx) as Promise<PurchaseOrder>;
    });
  }

  async getPurchaseOrder(id: string): Promise<PurchaseOrder> {
    const po = await this.repo.findById(id);
    if (!po) throw new NotFoundError(`PurchaseOrder ${id} not found`);
    return po;
  }

  async listPurchaseOrders(filter: ListPOQueryDto): Promise<PurchaseOrder[]> {
    return this.repo.list(filter);
  }

  async submitForApproval(id: string): Promise<PurchaseOrder> {
    const po = await this.getPurchaseOrder(id);
    if (po.status !== 'draft') throw new ConflictError(`Cannot submit PO in status ${po.status}`);

    return this.repo.withTransaction(async (tx) => {
      const updated = await this.repo.updateStatus(tx, id, 'pending');
      await this.outbox.enqueue(tx, {
        eventType: 'procurement.po.submitted',
        aggregateId: id,
        payload: { poId: id, supplierId: po.supplierId, totalCost: po.totalCost },
      });
      return updated;
    });
  }

  async approvePurchaseOrder(id: string, input: ApprovePODto): Promise<PurchaseOrder> {
    const po = await this.getPurchaseOrder(id);
    if (po.status !== 'pending') throw new ConflictError(`Cannot approve PO in status ${po.status}`);

    return this.repo.withTransaction(async (tx) => {
      await this.repo.addApproval(tx, id, input.approvedBy, input.note);

      const updated = await this.repo.updateStatus(tx, id, 'approved', {
        approvedBy: input.approvedBy,
        approvedAt: new Date(),
      });

      await this.outbox.enqueue(tx, {
        eventType: 'procurement.po.approved',
        aggregateId: id,
        payload: {
          poId: id,
          supplierId: po.supplierId,
          supplierName: po.supplierName,
          totalCost: po.totalCost,
          currency: po.currency,
          expectedDate: po.expectedDate,
          approvedBy: input.approvedBy,
          lines: (po.lines ?? []).map((l) => ({
            productCode: l.productCode,
            orderedQty: l.orderedQty,
            unitCost: l.unitCost,
          })),
        },
      });

      return updated;
    });
  }

  async sendPurchaseOrder(id: string): Promise<PurchaseOrder> {
    const po = await this.getPurchaseOrder(id);
    if (po.status !== 'approved') throw new ConflictError(`Cannot send PO in status ${po.status}`);

    return this.repo.withTransaction(async (tx) => {
      const updated = await this.repo.updateStatus(tx, id, 'sent', { sentAt: new Date() });
      await this.outbox.enqueue(tx, {
        eventType: 'procurement.po.sent',
        aggregateId: id,
        payload: { poId: id, supplierId: po.supplierId, sentAt: new Date().toISOString() },
      });
      return updated;
    });
  }

  async closePurchaseOrder(id: string): Promise<PurchaseOrder> {
    const po = await this.getPurchaseOrder(id);
    if (po.status !== 'sent' && po.status !== 'received') {
      throw new ConflictError(`Cannot close PO in status ${po.status}`);
    }

    return this.repo.withTransaction(async (tx) => {
      const updated = await this.repo.updateStatus(tx, id, 'closed', { closedAt: new Date() });
      await this.outbox.enqueue(tx, {
        eventType: 'procurement.po.closed',
        aggregateId: id,
        payload: { poId: id, supplierId: po.supplierId },
      });
      return updated;
    });
  }

  async cancelPurchaseOrder(id: string, input: CancelPODto): Promise<PurchaseOrder> {
    const po = await this.getPurchaseOrder(id);
    if (po.status === 'closed' || po.status === 'cancelled') {
      throw new ConflictError(`Cannot cancel PO in status ${po.status}`);
    }

    return this.repo.withTransaction(async (tx) => {
      const updated = await this.repo.updateStatus(tx, id, 'cancelled', {
        cancelledAt: new Date(),
        cancellationReason: input.reason,
      });
      await this.outbox.enqueue(tx, {
        eventType: 'procurement.po.cancelled',
        aggregateId: id,
        payload: { poId: id, reason: input.reason },
      });
      return updated;
    });
  }

  async recordReceipt(poId: string, productCode: string, receivedQty: number): Promise<void> {
    await this.repo.withTransaction(async (tx) => {
      await this.repo.updateLineReceivedQty(tx, poId, productCode, receivedQty);
      await this.outbox.enqueue(tx, {
        eventType: 'procurement.po.received',
        aggregateId: poId,
        payload: { poId, productCode, receivedQty },
      });
    });
  }
}
