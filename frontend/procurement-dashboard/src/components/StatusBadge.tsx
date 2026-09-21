import { POStatus } from '../api/types';

export function StatusBadge({ status }: { status: POStatus }) {
  return <span className={`badge badge-${status}`}>{status}</span>;
}
