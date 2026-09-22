import * as grpc from '@grpc/grpc-js';
import { StockService } from '../modules/stock/stock.service';

interface CheckAvailabilityRequest { product_code: string; location_code: string }
interface GetStockItemRequest { product_code: string; location_code: string }
type GrpcCallback = (err: unknown, response?: unknown) => void;

export function buildInventoryGrpcHandlers(service: StockService) {
  return {
    CheckAvailability: async (call: { request: CheckAvailabilityRequest }, callback: GrpcCallback): Promise<void> => {
      try {
        const item = await service.getStockItem(call.request.product_code, call.request.location_code);
        callback(null, {
          product_code: item.productCode,
          location_code: item.locationCode,
          on_hand: item.onHand,
          allocated: item.allocated,
          available: item.available,
        });
      } catch (err) {
        callback({
          code: grpc.status.NOT_FOUND,
          message: (err as Error).message,
        });
      }
    },

    GetStockItem: async (call: { request: GetStockItemRequest }, callback: GrpcCallback): Promise<void> => {
      try {
        const item = await service.getStockItem(call.request.product_code, call.request.location_code);
        callback(null, {
          id: item.id,
          product_code: item.productCode,
          product_name: item.productName,
          location_code: item.locationCode,
          on_hand: item.onHand,
          allocated: item.allocated,
          available: item.available,
          on_order: item.onOrder,
          unit_cost: item.unitCost,
          valuation: item.valuation,
        });
      } catch (err) {
        callback({
          code: grpc.status.NOT_FOUND,
          message: (err as Error).message,
        });
      }
    },
  };
}
