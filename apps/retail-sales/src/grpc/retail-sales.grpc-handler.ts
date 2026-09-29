import * as grpc from '@grpc/grpc-js';
import { SaleService } from '../modules/sale/sale.service';
import { ReturnService } from '../modules/return/return.service';
import { InventoryClient } from './inventory.client';

type Cb = (err: unknown, response?: unknown) => void;

export function buildRetailSalesGrpcHandlers(
  sales: SaleService,
  returns: ReturnService,
  inventory: InventoryClient,
) {
  return {
    GetSale: async (call: any, cb: Cb): Promise<void> => {
      try {
        const s = await sales.get(call.request.id);
        cb(null, { id: s.id, sale_number: s.saleNumber, store_location: s.storeLocation, status: s.status, grand_total: s.grandTotal });
      } catch (err) { cb({ code: grpc.status.NOT_FOUND, message: (err as Error).message }); }
    },
    GetReturn: async (call: any, cb: Cb): Promise<void> => {
      try {
        const r = await returns.get(call.request.id);
        cb(null, { id: r.id, return_number: r.returnNumber, original_sale_id: r.originalSaleId, status: r.status, refund_total: r.refundTotal });
      } catch (err) { cb({ code: grpc.status.NOT_FOUND, message: (err as Error).message }); }
    },
    ValidateStock: async (call: any, cb: Cb): Promise<void> => {
      try {
        const results = await inventory.validateStock(
          call.request.store_location,
          (call.request.lines ?? []).map((l: any) => ({ productCode: l.product_code, quantity: l.quantity })),
        );
        cb(null, { all_available: results.every((r) => r.available), results: results.map((r) => ({ product_code: r.productCode, available: r.available, requested: r.requested, on_hand: r.onHand })) });
      } catch (err) { cb({ code: grpc.status.INTERNAL, message: (err as Error).message }); }
    },
  };
}
