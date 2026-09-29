export type GRNStatus = 'draft' | 'completed';
export type LineCondition = 'good' | 'damaged' | 'quarantined';

export interface GRNLine {
  id: string;
  goodsReceivedNoteId: string;
  productCode: string;
  productName: string;
  orderedQty: number;
  receivedQty: number;
  damagedQty: number;
  condition: LineCondition;
  unitCost: number;
  lineTotal: number;
  notes: string | null;
}

export interface GoodsReceivedNote {
  id: string;
  purchaseOrderId: string;
  supplierId: string;
  supplierName: string;
  status: GRNStatus;
  receivedAt: string | null;
  shortages: number;
  overages: number;
  damages: number;
  notes: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  lines?: GRNLine[];
}

export interface RecordLineDto {
  productCode: string;
  receivedQty: number;
  damagedQty: number;
  condition: LineCondition;
  notes?: string;
}
