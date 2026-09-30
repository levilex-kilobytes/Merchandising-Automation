export type POStatus = 'draft' | 'pending' | 'approved' | 'sent' | 'received' | 'closed' | 'cancelled';

export interface POLine {
  id: string;
  purchaseOrderId: string;
  productCode: string;
  productName: string;
  orderedQty: number;
  receivedQty: number;
  unitCost: number;
  lineTotal: number;
  leadTimeDays: number;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  status: POStatus;
  currency: string;
  totalCost: number;
  expectedDate: string;
  notes: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  sentAt: string | null;
  closedAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
  lines?: POLine[];
}

export interface CreatePODto {
  supplierId: string;
  currency: string;
  expectedDate: string;
  notes?: string;
  lines: Array<{ productCode: string; quantity: number }>;
}
