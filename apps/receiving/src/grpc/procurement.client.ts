import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { config } from '../config';

interface POExpectedItem {
  product_code: string;
  ordered_qty: number;
  received_qty: number;
  unit_cost: number;
}

interface PO {
  id: string;
  supplier_id: string;
  status: string;
  currency: string;
  total_cost: number;
  expected_date: string;
}

export class ProcurementClient {
  private client: any;

  constructor() {
    const protoPath = path.resolve(__dirname, '../../../../contracts/proto/procurement.proto');
    const packageDef = protoLoader.loadSync(protoPath, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });
    const proto = grpc.loadPackageDefinition(packageDef) as Record<string, any>;
    const Ctor = proto.mfa.procurement.v1.ProcurementService;
    this.client = new Ctor(config.PROCUREMENT_GRPC_URL, grpc.credentials.createInsecure());
  }

  getPurchaseOrder(id: string): Promise<PO> {
    return new Promise((resolve, reject) => {
      this.client.GetPurchaseOrder({ id }, (err: any, response: PO) => {
        if (err) reject(err);
        else resolve(response);
      });
    });
  }

  getPOExpectedItems(poId: string): Promise<POExpectedItem[]> {
    return new Promise((resolve, reject) => {
      this.client.GetPOExpectedItems({ po_id: poId }, (err: any, response: { items: POExpectedItem[] }) => {
        if (err) reject(err);
        else resolve(response.items);
      });
    });
  }
}
