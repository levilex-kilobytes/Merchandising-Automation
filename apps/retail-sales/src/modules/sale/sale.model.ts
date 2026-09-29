import { Sale, SaleLine, Payment } from './sale.types';

export interface SaleRow {
  id: string; sale_number: string; store_location: string; cashier_id: string | null;
  subtotal: string; discount_total: string; tax_total: string; grand_total: string;
  status: string; completed_at: Date | null; voided_at: Date | null;
  created_at: Date; updated_at: Date;
}
export interface SaleLineRow {
  id: string; sale_id: string; product_code: string; product_name: string;
  quantity: number; unit_price: string; discount_amount: string; line_total: string;
}
export interface PaymentRow {
  id: string; sale_id: string; method: string; amount: string; reference: string | null;
}

export function toSale(r: SaleRow, lines?: SaleLineRow[], payments?: PaymentRow[]): Sale {
  return {
    id: r.id, saleNumber: r.sale_number, storeLocation: r.store_location,
    cashierId: r.cashier_id, subtotal: Number(r.subtotal),
    discountTotal: Number(r.discount_total), taxTotal: Number(r.tax_total),
    grandTotal: Number(r.grand_total), status: r.status as Sale['status'],
    completedAt: r.completed_at, voidedAt: r.voided_at,
    createdAt: r.created_at, updatedAt: r.updated_at,
    lines: lines?.map(toSaleLine), payments: payments?.map(toPayment),
  };
}
export function toSaleLine(r: SaleLineRow): SaleLine {
  return {
    id: r.id, saleId: r.sale_id, productCode: r.product_code, productName: r.product_name,
    quantity: r.quantity, unitPrice: Number(r.unit_price),
    discountAmount: Number(r.discount_amount), lineTotal: Number(r.line_total),
  };
}
export function toPayment(r: PaymentRow): Payment {
  return { id: r.id, saleId: r.sale_id, method: r.method as Payment['method'], amount: Number(r.amount), reference: r.reference };
}
