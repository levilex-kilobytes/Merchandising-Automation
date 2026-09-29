import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Boxes, CheckCircle2, ClipboardList, ArrowRight, PackageOpen } from 'lucide-react';
import { warehouseApi } from '../api/warehouse';
import { StatusBadge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import { TableSkeleton } from '../components/Skeleton';
import { StatCard } from '../components/StatCard';
import { TaskStatus } from '../api/types';

export function PutawayList() {
  const [status, setStatus] = useState<TaskStatus | ''>('pending');

  const { data: tasks, isLoading, error } = useQuery({
    queryKey: ['putaway-tasks', { status }],
    queryFn: () => warehouseApi.listPutawayTasks(status || undefined),
  });

  const stats = useMemo(() => {
    if (!tasks) return { pending: 0, completed: 0, total: 0 };
    const pending = tasks.filter((t) => t.status === 'pending').length;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    return { pending, completed, total: tasks.length };
  }, [tasks]);

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Putaway Tasks</h2>
          <p>Store received goods into their assigned bins.</p>
        </div>
      </div>

      <div className="summary">
        <StatCard icon={<ClipboardList size={22} />} label="Pending" value={stats.pending} tone="warning" />
        <StatCard icon={<CheckCircle2 size={22} />} label="Completed" value={stats.completed} tone="success" />
        <StatCard icon={<Boxes size={22} />} label="Total" value={stats.total} tone="primary" />
      </div>

      <div className="filters">
        {(['pending', 'completed', ''] as const).map((s) => (
          <button
            key={s || 'all'}
            className={`chip ${status === s ? 'active' : ''}`}
            onClick={() => setStatus(s)}
          >
            {s === '' ? 'All' : s === 'pending' ? 'Pending' : 'Completed'}
          </button>
        ))}
      </div>

      {isLoading && <TableSkeleton rows={4} />}
      {error && <div className="error-box">Failed to load putaway tasks.</div>}

      {tasks && tasks.length === 0 && (
        <EmptyState
          icon={<PackageOpen size={30} />}
          title="No putaway tasks"
          hint="Tasks appear automatically when Receiving completes a Goods Received Note."
        />
      )}

      {tasks && tasks.length > 0 && (
        <table className="responsive-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Quantity</th>
              <th>Assigned Bin</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id}>
                <td data-label="Product">
                  <div className="cell-product">
                    <strong>{task.productName}</strong>
                    <code>{task.productCode}</code>
                  </div>
                </td>
                <td data-label="Quantity">
                  <span className="cell-qty">{task.quantity}</span>
                </td>
                <td data-label="Bin">
                  <span className="cell-bin"><code>{task.assignedBin}</code></span>
                </td>
                <td data-label="Status"><StatusBadge status={task.status} /></td>
                <td data-label="">
                  {task.status === 'pending' ? (
                    <Link to={`/putaway/${task.id}`} className="btn-primary btn-sm">
                      Start <ArrowRight size={14} />
                    </Link>
                  ) : (
                    <span style={{ color: 'var(--muted)', fontSize: 13 }}>
                      {task.completedAt ? new Date(task.completedAt).toLocaleString() : '—'}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
