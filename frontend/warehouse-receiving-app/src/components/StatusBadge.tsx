import { GRNStatus, ItemCondition } from '../api/types';

export function StatusBadge({ status }: { status: GRNStatus }) {
  return <span className={`badge badge-${status}`}>{status}</span>;
}

export function ConditionBadge({ condition }: { condition: ItemCondition }) {
  return <span className={`badge badge-${condition}`}>{condition}</span>;
}
