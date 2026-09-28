export type GoodsReceivedNoteStatus = 'draft' | 'completed';
export type ItemCondition = 'good' | 'damaged';

export interface GoodsReceivedNote {
  id: string;
  purchaseOrderId: string;
  supplierId: string;
  supplierName: string;
  status: GoodsReceivedNoteStatus;
  receivedAt: string | null;
  shortages: number;
  overages: number;
  damages: number;
  notes: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface CreateGoodsReceivedNoteDto {
  purchaseOrderId: string;
  notes?: string;
}

export interface RecordGoodsReceivedNoteLineDto {
  productCode: string;
  receivedQty: number;
  condition: ItemCondition;
  damagedQty?: number;
  notes?: string;
}
