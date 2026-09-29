export type ReturnStatus = 'completed' | 'voided';

export interface ReturnLine { id: string; returnId: string; productCode: string; quantity: number; refundAmount: number }
export interface SaleReturn {
  id: string; returnNumber: string; originalSaleId: string; storeLocation: string;
  reason: string | null; refundTotal: number; status: ReturnStatus;
  completedAt: Date | null; createdAt: Date; updatedAt: Date;
  lines?: ReturnLine[];
}
export interface CreateReturnLineDto { productCode: string; quantity: number }
export interface CreateReturnDto { originalSaleId: string; reason?: string; lines: CreateReturnLineDto[] }
