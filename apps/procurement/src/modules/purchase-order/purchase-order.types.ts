export type POStatus = 'draft' | 'pending' | 'approved' | 'sent' | 'received' | 'closed' | 'cancelled';

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  status: POStatus;
  currency: string;
  totalCost: number;
  expectedDate: Date;
  notes?: string | null;
  approvedBy?: string | null;
  approvedAt?: Date | null;
  sentAt?: Date | null;
  closedAt?: Date | null;
  cancelledAt?: Date | null;
  cancellationReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
  lines?: POLine[];
}

export interface POLine {
  id: string;
  poId: string;
  productCode: string;
  productName: string;
  orderedQty: number;
  receivedQty: number;
  unitCost: number;
  lineTotal: number;
  leadTimeDays: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePOLineDto {
  productCode: string;
  quantity: number;
}

export interface CreatePODto {
  supplierId: string;
  currency: string;
  expectedDate: string;
  notes?: string;
  lines: CreatePOLineDto[];
}

export interface ApprovePODto {
  approvedBy: string;
  note?: string;
}

export interface CancelPODto {
  reason: string;
}

export interface ListPOQueryDto {
  status?: POStatus;
  supplierId?: string;
}
