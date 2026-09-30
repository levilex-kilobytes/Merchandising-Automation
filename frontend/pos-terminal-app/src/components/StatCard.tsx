import { ReactNode } from 'react';

export function StatCard({
  icon,
  label,
  value,
  tone = 'primary',
}: {
  icon: ReactNode;
  label: string;
  value: number | string;
  tone?: 'primary' | 'success' | 'warning' | 'danger';
}) {
  return (
    <div className={`stat stat-${tone}`}>
      <div className="stat-icon">{icon}</div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}
