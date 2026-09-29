import { PhysicalCount, Reconciliation } from './reconciliation.types';

export interface PhysicalCountRow {
  id: string; register_session_id: string;
  cash_counted: string; card_counted: string; other_counted: string;
  counted_by: string | null; created_at: Date;
}
export interface ReconciliationRow {
  id: string; register_session_id: string;
  expected_total: string; counted_total: string;
  overage: string; shortage: string;
  explanation: string | null; signed_off_by: string | null; created_at: Date;
}

export function toCount(r: PhysicalCountRow): PhysicalCount {
  return {
    id: r.id, registerSessionId: r.register_session_id,
    cashCounted: Number(r.cash_counted), cardCounted: Number(r.card_counted), otherCounted: Number(r.other_counted),
    countedBy: r.counted_by, createdAt: r.created_at,
  };
}

export function toReconciliation(r: ReconciliationRow): Reconciliation {
  return {
    id: r.id, registerSessionId: r.register_session_id,
    expectedTotal: Number(r.expected_total), countedTotal: Number(r.counted_total),
    overage: Number(r.overage), shortage: Number(r.shortage),
    explanation: r.explanation, signedOffBy: r.signed_off_by, createdAt: r.created_at,
  };
}
