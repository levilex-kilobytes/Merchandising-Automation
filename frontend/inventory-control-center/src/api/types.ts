export type MovementType = 'received' | 'sold' | 'adjusted' | 'reserved' | 'released' | 'transferred';
export interface StockItem {
  id: string; productCode: string; productName: string; locationCode: string;
  onHand: number; allocated: number; available: number; onOrder: number;
  unitCost: number; valuation: number; lowStockThreshold: number;
  createdAt: string; updatedAt: string;
}
export interface StockMovement {
  id: string; productCode: string; locationCode: string;
  movementType: MovementType; quantity: number;
  referenceId: string | null; referenceType: string | null; notes: string | null; createdAt: string;
}
export interface AdjustmentDto { productCode: string; locationCode: string; delta: number; reason: string; }
