import * as grpc from '@grpc/grpc-js';
import { RegisterService } from '../modules/register/register.service';

type Cb = (err: unknown, response?: unknown) => void;

export function buildSalesAuditGrpcHandlers(registers: RegisterService) {
  return {
    GetRegisterSession: async (call: any, cb: Cb): Promise<void> => {
      try {
        const s = await registers.getSession(call.request.id);
        cb(null, {
          id: s.id, register_code: s.registerCode, store_location: s.storeLocation,
          business_date: s.businessDate, status: s.status,
          expected_total: s.expectedTotal, counted_total: s.countedTotal, difference: s.difference,
        });
      } catch (err) { cb({ code: grpc.status.NOT_FOUND, message: (err as Error).message }); }
    },
    GetReconciliation: async (_call: any, cb: Cb): Promise<void> => {
      cb({ code: grpc.status.UNIMPLEMENTED, message: 'GetReconciliation not implemented' });
    },
  };
}
