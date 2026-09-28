import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { config } from '../config';

interface VendorSupplier {
  id: string;
  name: string;
  payment_terms: string;
  default_currency: string;
  status: string;
}

interface VendorProduct {
  id: string;
  supplier_id: string;
  product_code: string;
  product_name: string;
  unit_cost: number;
  currency: string;
  lead_time_days: number;
  min_order_qty: number;
}

export interface SupplierForProduct {
  id: string;
  supplierId: string;
  supplierName: string;
  productCode: string;
  productName: string;
  unitCost: number;
  currency: string;
  leadTimeDays: number;
  minOrderQty: number;
}

export class VendorClient {
  private client: any;

  constructor() {
    const protoPath = path.resolve(__dirname, '../../../../contracts/proto/vendor.proto');
    const packageDef = protoLoader.loadSync(protoPath, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });
    const proto = grpc.loadPackageDefinition(packageDef) as Record<string, any>;
    const Ctor = proto.mfa.vendor.v1.VendorService;
    this.client = new Ctor(config.VENDOR_GRPC_URL, grpc.credentials.createInsecure());
  }

  getSupplier(id: string): Promise<VendorSupplier> {
    return new Promise((resolve, reject) => {
      this.client.GetSupplier({ id }, (err: any, response: VendorSupplier) => {
        if (err) reject(err);
        else resolve(response);
      });
    });
  }

  getSupplierProduct(supplierId: string, productCode: string): Promise<VendorProduct> {
    return new Promise((resolve, reject) => {
      this.client.GetSupplierProduct(
        { supplier_id: supplierId, product_code: productCode },
        (err: any, response: VendorProduct) => {
          if (err) reject(err);
          else resolve(response);
        },
      );
    });
  }

  listSuppliersForProduct(productCode: string): Promise<SupplierForProduct[]> {
    return new Promise((resolve, reject) => {
      this.client.ListSuppliersForProduct(
        { product_code: productCode },
        (err: any, response: { suppliers?: any[] }) => {
          if (err) return reject(err);
          const suppliers = (response?.suppliers ?? []).map((s) => ({
            id: s.id,
            supplierId: s.supplier_id,
            supplierName: '', // Vendor's proto doesn't return the name yet; fallback below
            productCode: s.product_code,
            productName: s.product_name,
            unitCost: s.unit_cost,
            currency: s.currency,
            leadTimeDays: s.lead_time_days,
            minOrderQty: s.min_order_qty,
          }));
          resolve(suppliers);
        },
      );
    });
  }
}
