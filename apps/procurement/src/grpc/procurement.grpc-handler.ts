import * as grpc from '@grpc/grpc-js';
import { PurchaseOrderService } from '../modules/purchase-order/purchase-order.service';

interface GetPORequest { id: string }
interface GetPOItemsRequest { po_id: string }
type GrpcCallback = (err: unknown, response?: unknown) => void;

export function buildProcurementGrpcHandlers(service: PurchaseOrderService) {
  return {
    GetPurchaseOrder: async (call: { request: GetPORequest }, callback: GrpcCallback): Promise<void> => {
      try {
        const po = await service.getPurchaseOrder(call.request.id);
        callback(null, {
          id: po.id,
          supplier_id: po.supplierId,
          status: po.status,
          currency: po.currency,
          total_cost: po.totalCost,
          expected_date: po.expectedDate.toISOString().split('T')[0],
        });
      } catch (err) {
        callback({ code: grpc.status.NOT_FOUND, message: (err as Error).message });
      }
    },

    GetPOExpectedItems: async (call: { request: GetPOItemsRequest }, callback: GrpcCallback): Promise<void> => {
      try {
        const po = await service.getPurchaseOrder(call.request.po_id);
        callback(null, {
          items: (po.lines ?? []).map((l) => ({
            product_code: l.productCode,
            product_name: l.productName,
            ordered_qty: l.orderedQty,
            received_qty: l.receivedQty,
            unit_cost: l.unitCost,
          })),
        });
      } catch (err) {
        callback({ code: grpc.status.NOT_FOUND, message: (err as Error).message });
      }
    },
  };
}
