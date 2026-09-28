export type PurchaseOrderStatus = 'draft' | 'pending' | 'approved' | 'sent' | 'received' | 'closed' | 'cancelled';

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  status: PurchaseOrderStatus;
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
  lines?: PurchaseOrderLine[];
}

export interface PurchaseOrderLine {
  id: string;
  purchaseOrderId: string;
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

export interface CreatePurchaseOrderLineDto {
  productCode: string;
  quantity: number;
}

export interface CreatePurchaseOrderDto {
  supplierId: string;
  currency: string;
  expectedDate: string;
  notes?: string;
  lines: CreatePurchaseOrderLineDto[];
}

export interface ApprovePurchaseOrderDto {
  approvedBy: string;
  note?: string;
}

export interface CancelPurchaseOrderDto {
  reason: string;
}

export interface ListPurchaseOrdersQueryDto {
  status?: PurchaseOrderStatus;
  supplierId?: string;
}
