export function StatusBadge({ status }: { status: string }) {
  return <span className={`badge badge-${status}`}>{status}</span>;
}

export function CapacityBar({ used, capacity }: { used: number; capacity: number }) {
  const pct = capacity === 0 ? 0 : Math.min(100, Math.round((used / capacity) * 100));
  const className = pct >= 90 ? 'capacity-full' : pct >= 70 ? 'capacity-warn' : 'capacity-ok';
  return (
    <div className="capacity-wrap">
      <div className="capacity-label">
        <span>{used} / {capacity}</span>
        <span>{pct}%</span>
      </div>
      <div className="capacity-bar">
        <div className={`capacity-bar-fill ${className}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
