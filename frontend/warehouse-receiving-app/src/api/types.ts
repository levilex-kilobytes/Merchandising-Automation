export type GRNStatus = 'draft' | 'completed';
export type ItemCondition = 'good' | 'damaged';

export interface GRN {
  id: string;
  poId: string;
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

export interface GRNLine {
  id: string;
  grnId: string;
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

export interface CreateGRNDto {
  poId: string;
  notes?: string;
}

export interface RecordLineDto {
  productCode: string;
  receivedQty: number;
  condition: ItemCondition;
  damagedQty?: number;
  notes?: string;
}
