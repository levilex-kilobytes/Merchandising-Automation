import { PoolClient } from 'pg';
import { withTransaction } from '../../config/database';
import { PhysicalCountRow, ReconciliationRow, toCount, toReconciliation } from './reconciliation.model';
import { PhysicalCount, Reconciliation } from './reconciliation.types';

export class ReconciliationRepository {
  withTransaction = withTransaction;

  async recordCount(tx: PoolClient, input: {
    registerSessionId: string; cashCounted: number; cardCounted: number;
    otherCounted: number; countedBy: string | null;
  }): Promise<PhysicalCount> {
    const { rows } = await tx.query<PhysicalCountRow>(
      `INSERT INTO physical_counts (register_session_id, cash_counted, card_counted, other_counted, counted_by)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [input.registerSessionId, input.cashCounted, input.cardCounted, input.otherCounted, input.countedBy],
    );
    return toCount(rows[0]);
  }

  async createReconciliation(tx: PoolClient, input: {
    registerSessionId: string; expectedTotal: number; countedTotal: number;
    overage: number; shortage: number; explanation: string | null; signedOffBy: string | null;
  }): Promise<Reconciliation> {
    const { rows } = await tx.query<ReconciliationRow>(
      `INSERT INTO reconciliations (register_session_id, expected_total, counted_total, overage, shortage, explanation, signed_off_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [input.registerSessionId, input.expectedTotal, input.countedTotal, input.overage, input.shortage, input.explanation, input.signedOffBy],
    );
    return toReconciliation(rows[0]);
  }
}
