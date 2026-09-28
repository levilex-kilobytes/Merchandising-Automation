export type ReorderStatus = 'pending' | 'dismissed' | 'converted';

export interface ReorderSuggestion {
  id: string;
  productCode: string;
  productName: string;
  supplierId: string;
  supplierName: string;
  suggestedQuantity: number;
  unitCost: number;
  currency: string;
  leadTimeDays: number;
  reason: string;
  status: ReorderStatus;
  convertedPoId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSuggestionInput {
  productCode: string;
  currentStock: number;
  threshold: number;
}

export interface StockLowPayload {
  productCode: string;
  locationCode: string;
  available: number;
  threshold: number;
}
