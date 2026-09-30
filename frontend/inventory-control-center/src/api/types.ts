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
  isLowStock?: boolean;
  updatedAt: string;
}

export type MovementType = 'received' | 'sold' | 'returned' | 'adjusted' | 'transferred';

export interface StockMovement {
  id: string;
  productCode: string;
  locationCode: string;
  movementType: MovementType;
  quantity: number;
  referenceId: string | null;
  referenceType: string | null;
  notes: string | null;
  createdAt: string;
}

export interface StockFilters {
  productCode?: string;
  locationCode?: string;
  lowStockOnly?: boolean;
}

export interface AdjustStockInput {
  productCode: string;
  locationCode: string;
  delta: number;
  reason?: string;
}

export interface LocationSummary {
  locationCode: string;
  skuCount: number;
  totalUnits: number;
  totalValuation: number;
  lowStockCount: number;
}
