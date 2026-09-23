export type GRNStatus = 'draft' | 'completed';
export type ItemCondition = 'good' | 'damaged';

export interface GRN {
  id: string;
  poId: string;
  supplierId: string;
  supplierName: string;
  status: GRNStatus;
  receivedAt: Date | null;
  shortages: number;
  overages: number;
  damages: number;
  notes: string | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
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
  createdAt: Date;
  updatedAt: Date;
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

export interface ListGRNQueryDto {
  status?: GRNStatus;
  poId?: string;
}
