import { SupplierProductRepository } from '../repositories/supplier-product.repository';
import { SupplierRepository } from '../repositories/supplier.repository';
import { OutboxRepository } from '../repositories/outbox.repository';
import { SupplierProduct, SupplierProductPriceHistory } from '../types/supplier';
import { CreateSupplierProductInput, UpdateSupplierProductInput } from '../types/dto';
import { ConflictError, NotFoundError } from '@mfa/errors';

export class SupplierProductService {
  constructor(
    private readonly products = new SupplierProductRepository(),
    private readonly suppliers = new SupplierRepository(),
    private readonly outbox = new OutboxRepository(),
  ) {}

  async addProduct(supplierId: string, input: CreateSupplierProductInput): Promise<SupplierProduct> {
    const supplier = await this.suppliers.findById(supplierId);
    if (!supplier) throw new NotFoundError(`Supplier ${supplierId} not found`);

    const existing = await this.products.findBySupplierAndCode(supplierId, input.productCode);
    if (existing) throw new ConflictError(`Supplier already sells product ${input.productCode}`);

    return this.products.withTransaction(async (tx) => {
      const product = await this.products.create(tx, supplierId, input);
      await this.outbox.enqueue(tx, {
        eventType: 'vendor.supplier.product.created',
        aggregateId: supplierId,
        payload: {
          supplierId,
          productId: product.id,
          productCode: product.productCode,
          unitCost: product.unitCost,
          currency: product.currency,
          leadTimeDays: product.leadTimeDays,
        },
      });
      return product;
    });
  }

  async updateProduct(id: string, patch: UpdateSupplierProductInput): Promise<SupplierProduct> {
    const existing = await this.products.findById(id);
    if (!existing) throw new NotFoundError(`SupplierProduct ${id} not found`);

    return this.products.withTransaction(async (tx) => {
      const updated = await this.products.update(tx, id, patch);
      if (patch.unitCost !== undefined && patch.unitCost !== existing.unitCost) {
        await this.outbox.enqueue(tx, {
          eventType: 'vendor.supplier.product.price.changed',
          aggregateId: updated.supplierId,
          payload: {
            supplierId: updated.supplierId,
            productCode: updated.productCode,
            oldCost: existing.unitCost,
            newCost: updated.unitCost,
            currency: updated.currency,
          },
        });
      }
      return updated;
    });
  }

  async changePrice(
    id: string,
    newCost: number,
    currency?: string,
    effectiveFrom?: string,
  ): Promise<{ product: SupplierProduct; history: SupplierProductPriceHistory }> {
    const existing = await this.products.findById(id);
    if (!existing) throw new NotFoundError(`SupplierProduct ${id} not found`);

    return this.products.withTransaction(async (tx) => {
      const result = await this.products.changePrice(tx, id, newCost, currency, effectiveFrom);
      await this.outbox.enqueue(tx, {
        eventType: 'vendor.supplier.product.price.changed',
        aggregateId: result.product.supplierId,
        payload: {
          supplierId: result.product.supplierId,
          productCode: result.product.productCode,
          oldCost: existing.unitCost,
          newCost: result.product.unitCost,
          currency: result.product.currency,
          effectiveFrom: result.history.effectiveFrom,
        },
      });
      return result;
    });
  }

  async getProduct(supplierId: string, productCode: string): Promise<SupplierProduct> {
    const product = await this.products.findBySupplierAndCode(supplierId, productCode);
    if (!product) throw new NotFoundError(`No product ${productCode} for supplier ${supplierId}`);
    return product;
  }

  async listBySupplier(supplierId: string): Promise<SupplierProduct[]> {
    const supplier = await this.suppliers.findById(supplierId);
    if (!supplier) throw new NotFoundError(`Supplier ${supplierId} not found`);
    return this.products.listBySupplier(supplierId);
  }

  async listSuppliersForProduct(productCode: string): Promise<SupplierProduct[]> {
    return this.products.listSuppliersForProduct(productCode);
  }

  async getPriceHistory(supplierId: string, productCode: string): Promise<SupplierProductPriceHistory[]> {
    return this.products.listPriceHistory(supplierId, productCode);
  }
}
