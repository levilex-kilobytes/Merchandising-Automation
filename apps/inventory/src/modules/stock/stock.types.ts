export type MovementType =
  | 'received'
  | 'sold'
  | 'adjusted'
  | 'reserved'
  | 'released'
  | 'transferred';

export interface StockItem {
  id: string;
  productCode: string;
  productName: string;
  locationCode: string;
  onHand: number;
  allocated: number;
  available: number;
  onOrder: number;
  unitCost: number;
  valuation: number;
  lowStockThreshold: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockMovement {
  id: string;
  productCode: string;
  locationCode: string;
  movementType: MovementType;
  quantity: number;
  referenceId: string | null;
  referenceType: string | null;
  notes: string | null;
  createdAt: Date;
}

export interface AdjustmentDto {
  productCode: string;
  locationCode: string;
  delta: number;
  reason: string;
}

export interface ListStockQueryDto {
  productCode?: string;
  locationCode?: string;
  lowOnly?: boolean;
}

export interface ReceiveStockInput {
  productCode: string;
  productName: string;
  locationCode: string;
  quantity: number;
  unitCost: number;
  referenceId: string;
  referenceType: string;
}

export interface ReserveStockInput {
  productCode: string;
  locationCode: string;
  quantity: number;
  referenceId: string;
}
