export type GoodsReceivedNoteStatus = 'draft' | 'completed';
export type ItemCondition = 'good' | 'damaged';

export interface GoodsReceivedNote {
  id: string;
  purchaseOrderId: string;
  supplierId: string;
  supplierName: string;
  status: GoodsReceivedNoteStatus;
  receivedAt: Date | null;
  shortages: number;
  overages: number;
  damages: number;
  notes: string | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  lines?: GoodsReceivedNoteLine[];
}

export interface GoodsReceivedNoteLine {
  id: string;
  goodsReceivedNoteId: string;
  productCode: string;
  productName: string;
  orderedQty: number;
  receivedQty: number;
  damagedQty: number;
  condition: ItemCondition;
  unitCost: number;
  lineTotal: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateGoodsReceivedNoteDto {
  purchaseOrderId: string;
  notes?: string;
}

export interface RecordLineDto {
  productCode: string;
  receivedQty: number;
  condition: ItemCondition;
  damagedQty?: number;
  notes?: string;
}

export interface ListGRNQueryDto {
  status?: GoodsReceivedNoteStatus;
  purchaseOrderId?: string;
}
