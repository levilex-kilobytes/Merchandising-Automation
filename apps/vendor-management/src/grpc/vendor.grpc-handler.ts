import * as grpc from '@grpc/grpc-js';
import { SupplierService } from '../services/supplier.service';
import { SupplierProductService } from '../services/supplier-product.service';

interface GetSupplierRequest { id: string }
interface GetSupplierProductRequest { supplier_id: string; product_code: string }
interface ListSuppliersForProductRequest { product_code: string }
type GrpcCallback = (err: unknown, response?: unknown) => void;

export function buildVendorGrpcHandlers(suppliers: SupplierService, products: SupplierProductService) {
  return {
    GetSupplier: async (call: { request: GetSupplierRequest }, callback: GrpcCallback): Promise<void> => {
      try {
        const s = await suppliers.getSupplier(call.request.id);
        callback(null, {
          id: s.id,
          name: s.name,
          payment_terms: s.paymentTerms,
          default_currency: s.defaultCurrency,
          status: s.status,
        });
      } catch (err) {
        callback({ code: grpc.status.NOT_FOUND, message: (err as Error).message });
      }
    },

    GetSupplierProduct: async (call: { request: GetSupplierProductRequest }, callback: GrpcCallback): Promise<void> => {
      try {
        const p = await products.getProduct(call.request.supplier_id, call.request.product_code);
        callback(null, {
          id: p.id,
          supplier_id: p.supplierId,
          product_code: p.productCode,
          product_name: p.productName,
          unit_cost: p.unitCost,
          currency: p.currency,
          lead_time_days: p.leadTimeDays,
          min_order_qty: p.minOrderQty,
        });
      } catch (err) {
        callback({ code: grpc.status.NOT_FOUND, message: (err as Error).message });
      }
    },

    ListSuppliersForProduct: async (call: { request: ListSuppliersForProductRequest }, callback: GrpcCallback): Promise<void> => {
      try {
        const list = await products.listSuppliersForProduct(call.request.product_code);
        callback(null, {
          suppliers: list.map((p) => ({
            id: p.id,
            supplier_id: p.supplierId,
            product_code: p.productCode,
            product_name: p.productName,
            unit_cost: p.unitCost,
            currency: p.currency,
            lead_time_days: p.leadTimeDays,
            min_order_qty: p.minOrderQty,
          })),
        });
      } catch (err) {
        callback({ code: grpc.status.INTERNAL, message: (err as Error).message });
      }
    },
  };
}
