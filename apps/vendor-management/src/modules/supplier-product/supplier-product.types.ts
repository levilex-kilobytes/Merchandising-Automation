export interface SupplierProduct {
  id: string;
  supplierId: string;
  productCode: string;
  productName: string;
  unitCost: number;
  currency: string;
  leadTimeDays: number;
  minOrderQty: number;
  isActive: boolean;
  validFrom: Date;
  validTo?: Date | null;
}

export interface SupplierProductPriceHistory {
  id: string;
  supplierId: string;
  productCode: string;
  oldCost: number | null;
  newCost: number;
  currency: string;
  effectiveFrom: Date;
  changedAt: Date;
}

export interface CreateSupplierProductDto {
  productCode: string;
  productName: string;
  unitCost: number;
  currency: string;
  leadTimeDays: number;
  minOrderQty: number;
  validFrom?: string;
}

export interface UpdateSupplierProductDto {
  productName?: string;
  unitCost?: number;
  currency?: string;
  leadTimeDays?: number;
  minOrderQty?: number;
  isActive?: boolean;
}

export interface ChangePriceDto {
  newCost: number;
  currency?: string;
  effectiveFrom?: string;
}
