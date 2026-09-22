import * as grpc from '@grpc/grpc-js';
import { GRNService } from '../modules/grn/grn.service';

interface GetGRNRequest { id: string }
interface ListGRNsByPORequest { po_id: string }
type GrpcCallback = (err: unknown, response?: unknown) => void;

export function buildReceivingGrpcHandlers(service: GRNService) {
  return {
    GetGRN: async (call: { request: GetGRNRequest }, callback: GrpcCallback): Promise<void> => {
      try {
        const grn = await service.getGRN(call.request.id);
        callback(null, {
          id: grn.id,
          po_id: grn.poId,
          supplier_id: grn.supplierId,
          status: grn.status,
          received_at: grn.receivedAt?.toISOString() ?? '',
          shortages: grn.shortages,
          overages: grn.overages,
          damages: grn.damages,
        });
      } catch (err) {
        callback({ code: grpc.status.NOT_FOUND, message: (err as Error).message });
      }
    },

    ListGRNsByPO: async (call: { request: ListGRNsByPORequest }, callback: GrpcCallback): Promise<void> => {
      try {
        const list = await service.listGRNs({ poId: call.request.po_id });
        callback(null, {
          grns: list.map((g) => ({
            id: g.id,
            po_id: g.poId,
            supplier_id: g.supplierId,
            status: g.status,
            received_at: g.receivedAt?.toISOString() ?? '',
            shortages: g.shortages,
            overages: g.overages,
            damages: g.damages,
          })),
        });
      } catch (err) {
        callback({ code: grpc.status.INTERNAL, message: (err as Error).message });
      }
    },
  };
}
