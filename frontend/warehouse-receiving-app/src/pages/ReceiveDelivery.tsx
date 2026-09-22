import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { receivingApi } from '../api/receiving';

export function ReceiveDelivery() {
  const navigate = useNavigate();
  const [poId, setPoId] = useState('');
  const [notes, setNotes] = useState('');

  const create = useMutation({
    mutationFn: () => receivingApi.createGRN({ poId, notes: notes || undefined }),
    onSuccess: (grn) => {
      navigate(`/grns/${grn.id}`);
    },
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    create.mutate();
  };

  return (
    <>
      <div className="page-header">
        <h2>Receive Delivery</h2>
      </div>

      {create.error && (
        <div className="error-box">{(create.error as Error).message}</div>
      )}

      <form className="card" onSubmit={submit}>
        <div className="field">
          <label>Purchase Order ID *</label>
          <input
            required
            value={poId}
            onChange={(e) => setPoId(e.target.value.trim())}
            placeholder="Paste the PO UUID from the procurement dashboard"
          />
          <p style={{ color: 'var(--muted)', marginTop: 8, fontSize: 14 }}>
            The GRN will be pre-populated with the expected items from the PO.
          </p>
        </div>

        <div className="field">
          <label>Notes (optional)</label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., Truck arrived at 9:30 AM, pallet damaged on arrival"
          />
        </div>

        <div className="actions" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="btn-secondary" onClick={() => navigate('/')}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={create.isPending || !poId}>
            {create.isPending ? 'Creating...' : 'Start Receiving'}
          </button>
        </div>
      </form>

      <div className="card">
        <h3 style={{ marginBottom: 16 }}>How it works</h3>
        <ol style={{ paddingLeft: 20, lineHeight: 2 }}>
          <li>Enter the PO ID from the approved purchase order</li>
          <li>The GRN is created in draft with all expected items</li>
          <li>Walk the dock and record received quantities per line</li>
          <li>Flag any damaged items and add notes</li>
          <li>Complete the GRN to publish the receiving event</li>
        </ol>
      </div>
    </>
  );
}
