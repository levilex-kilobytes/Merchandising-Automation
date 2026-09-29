export interface RetailPrice {
  productCode: string;
  productName: string;
  unitPrice: number;
  active: boolean;
}

export type SaleStatus = 'completed' | 'voided';
export type PaymentMethod = 'cash' | 'card' | 'gift_card' | 'mixed';

export interface SaleLine {
  id: string;
  saleId: string;
  productCode: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  lineTotal: number;
}

export interface Payment {
  id: string;
  saleId: string;
  method: PaymentMethod;
  amount: number;
  reference: string | null;
}

export interface Sale {
  id: string;
  saleNumber: string;
  storeLocation: string;
  cashierId: string | null;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  status: SaleStatus;
  completedAt: string | null;
  voidedAt: string | null;
  createdAt: string;
  updatedAt: string;
  lines?: SaleLine[];
  payments?: Payment[];
}

export interface CreateSaleDto {
  storeLocation: string;
  cashierId?: string;
  lines: Array<{ productCode: string; quantity: number; discountAmount?: number }>;
  payments: Array<{ method: PaymentMethod; amount: number; reference?: string }>;
}

export interface SaleReturn {
  id: string;
  returnNumber: string;
  originalSaleId: string;
  storeLocation: string;
  reason: string | null;
  refundTotal: number;
  status: string;
  completedAt: string | null;
  createdAt: string;
  lines?: Array<{ id: string; productCode: string; quantity: number; refundAmount: number }>;
}

export interface CreateReturnDto {
  originalSaleId: string;
  reason?: string;
  lines: Array<{ productCode: string; quantity: number }>;
}
