import { SupplierStatus } from '../api/types';

export function StatusBadge({ status }: { status: SupplierStatus }) {
  return <span className={`badge badge-${status}`}>{status}</span>;
}
