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
  completedAt: Date | null;
  voidedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  lines?: SaleLine[];
  payments?: Payment[];
}

export interface CreateSaleLineDto {
  productCode: string;
  quantity: number;
  discountAmount?: number;
}

export interface CreatePaymentDto {
  method: PaymentMethod;
  amount: number;
  reference?: string;
}

export interface CreateSaleDto {
  storeLocation: string;
  cashierId?: string;
  lines: CreateSaleLineDto[];
  payments: CreatePaymentDto[];
}

export interface ListSalesQuery {
  storeLocation?: string;
  status?: SaleStatus;
}
