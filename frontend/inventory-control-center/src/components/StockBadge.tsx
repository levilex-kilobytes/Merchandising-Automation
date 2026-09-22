import { StockItem } from '../api/types';

export function AvailabilityBadge({ item }: { item: StockItem }) {
  const isLow = item.available <= item.lowStockThreshold;
  return (
    <span className={`badge ${isLow ? 'badge-low' : 'badge-ok'}`}>
      {isLow ? 'Low' : 'OK'}
    </span>
  );
}

export function MovementBadge({ type }: { type: string }) {
  return <span className={`badge badge-${type}`}>{type}</span>;
}
