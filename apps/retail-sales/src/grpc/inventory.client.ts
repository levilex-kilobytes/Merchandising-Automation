import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { config } from '../config';

interface StockLine { productCode: string; quantity: number }
interface StockResult { productCode: string; available: boolean; requested: number; onHand: number }

export class InventoryClient {
  private client: any;

  private ensure(): any {
    if (this.client) return this.client;
    const protoPath = path.resolve(__dirname, '../../../../contracts/proto/inventory.proto');
    const def = protoLoader.loadSync(protoPath, { keepCase: true, longs: String, enums: String, defaults: true, oneofs: true });
    const proto = grpc.loadPackageDefinition(def) as any;
    const Ctor = proto.mfa.inventory.v1.InventoryService;
    this.client = new Ctor(config.INVENTORY_GRPC_URL, grpc.credentials.createInsecure());
    return this.client;
  }

  validateStock(storeLocation: string, lines: StockLine[]): Promise<StockResult[]> {
    return new Promise((resolve, reject) => {
      const client = this.ensure();
      client.ValidateStock(
        { store_location: storeLocation, lines: lines.map((l) => ({ product_code: l.productCode, quantity: l.quantity })) },
        (err: any, reply: any) => {
          if (err) return reject(err);
          resolve((reply.results ?? []).map((r: any) => ({
            productCode: r.product_code, available: r.available, requested: r.requested, onHand: r.on_hand,
          })));
        },
      );
    });
  }
}
