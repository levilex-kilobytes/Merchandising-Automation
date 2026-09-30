import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Package, CheckCircle2, Clock, ArrowRight, PackageOpen } from 'lucide-react';
import { warehouseApi } from '../api/warehouse';
import { StatCard } from '../components/StatCard';
import { formatDateTime } from '../utils/format';

type Tab = 'pending' | 'completed' | 'all';

export function PutawayList() {
  const [tab, setTab] = useState<Tab>('pending');

  const { data: allTasks, isLoading, error } = useQuery({
    queryKey: ['putaway-tasks'],
    queryFn: () => warehouseApi.listPutawayTasks(),
  });

  const tasks = allTasks ?? [];

  const counts = useMemo(() => ({
    pending: tasks.filter((t) => t.status === 'pending').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
    total: tasks.length,
  }), [tasks]);

  const visible = useMemo(() => {
    if (tab === 'all') return tasks;
    return tasks.filter((t) => t.status === tab);
  }, [tasks, tab]);

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Putaway Tasks</h2>
          <p>Direct received goods to their assigned bins.</p>
        </div>
      </div>

      <div className="summary">
        <StatCard icon={<Clock size={22} />} label="Pending" value={counts.pending} tone="warning" />
        <StatCard icon={<CheckCircle2 size={22} />} label="Completed" value={counts.completed} tone="success" />
        <StatCard icon={<Package size={22} />} label="Total" value={counts.total} tone="primary" />
      </div>

      <div className="filters">
        {(['pending', 'completed', 'all'] as Tab[]).map((t) => (
          <button
            key={t}
            className={`chip ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'pending' ? 'Pending' : t === 'completed' ? 'Completed' : 'All'}
            <span style={{ marginLeft: 6, opacity: 0.7 }}>
              {t === 'pending' ? counts.pending : t === 'completed' ? counts.completed : counts.total}
            </span>
          </button>
        ))}
      </div>

      {isLoading && <div className="skeleton skeleton-row" />}
      {error && (
        <div className="error-box">
          Failed to load putaway tasks: {error instanceof Error ? error.message : 'unknown'}
        </div>
      )}

      {!isLoading && visible.length === 0 && (
        <div className="empty">
          <div className="empty-icon"><PackageOpen size={30} /></div>
          <div className="empty-title">
            {tab === 'completed' ? 'No completed tasks yet' : tab === 'pending' ? 'No pending tasks' : 'No tasks'}
          </div>
          <div className="empty-hint">
            {tab === 'pending'
              ? 'New tasks appear when Receiving completes a GRN.'
              : tab === 'completed'
                ? 'Completed tasks will show here.'
                : 'Tasks will appear here.'}
          </div>
        </div>
      )}

      {visible.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th className="num">Qty</th>
              <th>Assigned Bin</th>
              <th>Status</th>
              <th>Completed</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((task) => (
              <tr key={task.id}>
                <td>
                  <div className="cell-product">
                    <strong>{task.productName}</strong>
                    <code>{task.productCode}</code>
                  </div>
                </td>
                <td className="num"><span className="cell-qty">{task.quantity}</span></td>
                <td><span className="cell-bin"><code>{task.assignedBin}</code></span></td>
                <td>
                  <span className={`badge badge-${task.status === 'completed' ? 'completed' : 'pending'}`}>
                    {task.status === 'completed' ? 'Completed' : 'Pending'}
                  </span>
                </td>
                <td style={{ fontSize: 13, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                  {task.completedAt ? formatDateTime(task.completedAt) : '—'}
                </td>
                <td>
                  {task.status === 'pending' ? (
                    <Link to={`/putaway/${task.id}`} className="btn-primary btn-sm">
                      Start <ArrowRight size={14} />
                    </Link>
                  ) : (
                    <span style={{ fontSize: 13, color: 'var(--success)', fontWeight: 600 }}>✓ Done</span>
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
