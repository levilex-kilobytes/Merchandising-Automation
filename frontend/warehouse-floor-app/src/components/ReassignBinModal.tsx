import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, MapPin, AlertTriangle, Check } from 'lucide-react';
import { warehouseExtApi } from '../api/warehouse';
import { Skeleton } from './Skeleton';

export function ReassignBinModal({
  open,
  currentBin,
  zone,
  requiredCapacity,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  currentBin: string;
  zone?: string;
  requiredCapacity: number;
  onCancel: () => void;
  onConfirm: (newBin: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  const { data: bins, isLoading, error } = useQuery({
    queryKey: ['available-bins', { zone, requiredCapacity }],
    queryFn: () => warehouseExtApi.listAvailableBins(zone, requiredCapacity),
    enabled: open,
  });

  useEffect(() => {
    if (!open) setSelected(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  const sorted = (bins ?? [])
    .filter((b) => b.code !== currentBin)
    .sort((a, b) => (b.capacity - b.used) - (a.capacity - a.used));

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div
        className="modal modal-wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reassign-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onCancel} aria-label="Close">
          <X size={20} />
        </button>

        <div className="modal-icon modal-icon-primary">
          <MapPin size={26} />
        </div>
        <h3 id="reassign-title" className="modal-title">Reassign bin</h3>
        <p className="modal-message">
          Current bin <code>{currentBin}</code> can't be used.
          Choose a replacement with at least <strong>{requiredCapacity}</strong> free units.
        </p>

        {isLoading && (
          <div className="modal-list">
            <Skeleton className="skeleton-row" />
            <Skeleton className="skeleton-row" />
            <Skeleton className="skeleton-row" />
          </div>
        )}

        {error && (
          <div className="error-box" style={{ marginBottom: 12 }}>
            <AlertTriangle size={16} /> Could not load available bins.
          </div>
        )}

        {!isLoading && sorted.length === 0 && (
          <div className="modal-empty">
            <AlertTriangle size={28} />
            <p>No alternative bins with enough free capacity.</p>
            <p className="modal-empty-hint">
              Consider splitting the quantity across bins, or flag this for a supervisor.
            </p>
          </div>
        )}

        {sorted.length > 0 && (
          <ul className="bin-picker">
            {sorted.map((b) => (
              <li key={b.id}>
                <button
                  className={`bin-picker-item ${selected === b.code ? 'selected' : ''}`}
                  onClick={() => setSelected(b.code)}
                >
                  <div className="bin-picker-main">
                    <code className="bin-picker-code">{b.code}</code>
                    <span className="bin-picker-meta">
                      Zone {b.zone} · Aisle {b.aisle} · Rack {b.rack} · Shelf {b.shelf}
                    </span>
                  </div>
                  <div className="bin-picker-free">
                    <span className="bin-picker-free-num">{b.capacity - b.used}</span>
                    <span className="bin-picker-free-label">free</span>
                  </div>
                  {selected === b.code && (
                    <span className="bin-picker-check"><Check size={18} /></span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button
            className="btn-primary"
            disabled={!selected}
            onClick={() => selected && onConfirm(selected)}
          >
            Move to selected bin
          </button>
        </div>
      </div>
    </div>
  );
}
