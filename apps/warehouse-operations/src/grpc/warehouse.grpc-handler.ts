import * as grpc from '@grpc/grpc-js';
import { LocationService } from '../modules/location/location.service';
import { PutawayService } from '../modules/putaway/putaway.service';
import { PickingService } from '../modules/picking/picking.service';
import { TransferService } from '../modules/transfer/transfer.service';

type Cb = (err: unknown, response?: unknown) => void;

export function buildWarehouseGrpcHandlers(
  locations: LocationService,
  putaway: PutawayService,
  picking: PickingService,
  transfers: TransferService,
) {
  return {
    GetLocation: async (call: any, cb: Cb): Promise<void> => {
      try {
        const l = await locations.get(call.request.code);
        cb(null, {
          id: l.id, code: l.code, zone: l.zone, aisle: l.aisle,
          rack: l.rack, shelf: l.shelf, bin: l.bin,
          capacity: l.capacity, used: l.used,
        });
      } catch (err) { cb({ code: grpc.status.NOT_FOUND, message: (err as Error).message }); }
    },

    GetPutawayTask: async (call: any, cb: Cb): Promise<void> => {
      try {
        const t = await putaway.get(call.request.id);
        cb(null, {
          id: t.id, goods_received_note_id: t.goodsReceivedNoteId,
          product_code: t.productCode, quantity: t.quantity,
          assigned_bin: t.assignedBin, status: t.status,
        });
      } catch (err) { cb({ code: grpc.status.NOT_FOUND, message: (err as Error).message }); }
    },

    GetPickTask: async (call: any, cb: Cb): Promise<void> => {
      try {
        const t = await picking.get(call.request.id);
        cb(null, {
          id: t.id, product_code: t.productCode, quantity: t.quantity,
          from_bin: t.fromBin, to_location: t.toLocation, status: t.status,
        });
      } catch (err) { cb({ code: grpc.status.NOT_FOUND, message: (err as Error).message }); }
    },

    GetTransfer: async (call: any, cb: Cb): Promise<void> => {
      try {
        const t = await transfers.get(call.request.id);
        cb(null, {
          id: t.id, from_location: t.fromLocation,
          to_location: t.toLocation, status: t.status,
        });
      } catch (err) { cb({ code: grpc.status.NOT_FOUND, message: (err as Error).message }); }
    },
  };
}
