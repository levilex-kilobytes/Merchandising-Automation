import { StockItem, StockMovement } from './stock.types';

export interface StockItemRow {
  id: string; product_code: string; product_name: string; location_code: string;
  on_hand: number; allocated: number; on_order: number; unit_cost: string;
  low_stock_threshold: number; created_at: Date; updated_at: Date;
}

export function toStockItem(row: StockItemRow): StockItem {
  const onHand = row.on_hand; const allocated = row.allocated; const unitCost = Number(row.unit_cost);
  return {
    id: row.id, productCode: row.product_code, productName: row.product_name, locationCode: row.location_code,
    onHand, allocated, available: onHand - allocated, onOrder: row.on_order,
    unitCost, valuation: Number((onHand * unitCost).toFixed(2)),
    lowStockThreshold: row.low_stock_threshold, createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

export interface MovementRow {
  id: string; product_code: string; location_code: string; movement_type: string;
  quantity: number; reference_id: string | null; reference_type: string | null;
  notes: string | null; created_at: Date;
}

export function toMovement(row: MovementRow): StockMovement {
  return {
    id: row.id, productCode: row.product_code, locationCode: row.location_code,
    movementType: row.movement_type as StockMovement['movementType'],
    quantity: row.quantity, referenceId: row.reference_id,
    referenceType: row.reference_type, notes: row.notes, createdAt: row.created_at,
  };
}
