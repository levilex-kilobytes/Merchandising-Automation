import { PoolClient } from 'pg';
import { pool, withTransaction } from '../../config/database';
import { RegisterRow, SessionRow, toRegister, toSession } from './register.model';
import { Register, RegisterSession, OpenSessionDto } from './register.types';

export class RegisterRepository {
  withTransaction = withTransaction;

  async listRegisters(): Promise<Register[]> {
    const { rows } = await pool.query<RegisterRow>(`SELECT * FROM registers WHERE is_active = TRUE ORDER BY code`);
    return rows.map(toRegister);
  }

  async findRegister(code: string): Promise<Register | null> {
    const { rows } = await pool.query<RegisterRow>(`SELECT * FROM registers WHERE code = $1`, [code]);
    return rows[0] ? toRegister(rows[0]) : null;
  }

  async openSession(tx: PoolClient, input: OpenSessionDto): Promise<RegisterSession> {
    const { rows } = await tx.query<SessionRow>(
      `INSERT INTO register_sessions (register_code, store_location, business_date, cashier_id, status)
       VALUES ($1,$2,$3,$4,'open') RETURNING *`,
      [input.registerCode, input.storeLocation, input.businessDate, input.cashierId ?? null],
    );
    return toSession(rows[0]);
  }

  async findSessionById(id: string, tx?: PoolClient): Promise<RegisterSession | null> {
    const client = tx ?? pool;
    const { rows } = await client.query<SessionRow>(`SELECT * FROM register_sessions WHERE id = $1`, [id]);
    return rows[0] ? toSession(rows[0]) : null;
  }

  async findSessionByRegisterAndDate(registerCode: string, businessDate: string, tx?: PoolClient): Promise<RegisterSession | null> {
    const client = tx ?? pool;
    const { rows } = await client.query<SessionRow>(
      `SELECT * FROM register_sessions WHERE register_code = $1 AND business_date = $2`,
      [registerCode, businessDate],
    );
    return rows[0] ? toSession(rows[0]) : null;
  }

  async listSessions(filter: { storeLocation?: string; businessDate?: string; status?: string }): Promise<RegisterSession[]> {
    const clauses: string[] = [];
    const values: unknown[] = [];
    if (filter.storeLocation) { values.push(filter.storeLocation); clauses.push(`store_location = $${values.length}`); }
    if (filter.businessDate) { values.push(filter.businessDate); clauses.push(`business_date = $${values.length}`); }
    if (filter.status) { values.push(filter.status); clauses.push(`status = $${values.length}`); }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const { rows } = await pool.query<SessionRow>(
      `SELECT * FROM register_sessions ${where} ORDER BY business_date DESC, register_code ASC LIMIT 100`,
      values,
    );
    return rows.map(toSession);
  }

  async addExpectedTotal(tx: PoolClient, sessionId: string, amount: number): Promise<RegisterSession> {
    const { rows } = await tx.query<SessionRow>(
      `UPDATE register_sessions SET expected_total = expected_total + $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [amount, sessionId],
    );
    return toSession(rows[0]);
  }

  async updateAfterCount(tx: PoolClient, sessionId: string, countedTotal: number): Promise<RegisterSession> {
    const { rows } = await tx.query<SessionRow>(
      `UPDATE register_sessions
       SET counted_total = $1, difference = $1 - expected_total, status = 'counted', updated_at = NOW()
       WHERE id = $2 RETURNING *`,
      [countedTotal, sessionId],
    );
    return toSession(rows[0]);
  }

  async markClosed(tx: PoolClient, sessionId: string): Promise<RegisterSession> {
    const { rows } = await tx.query<SessionRow>(
      `UPDATE register_sessions SET status = 'closed', closed_at = NOW(), updated_at = NOW() WHERE id = $1 RETURNING *`,
      [sessionId],
    );
    return toSession(rows[0]);
  }

  async listDiscrepancies(filter: { storeLocation?: string; cashierId?: string }): Promise<RegisterSession[]> {
    const clauses: string[] = ['difference <> 0'];
    const values: unknown[] = [];
    if (filter.storeLocation) { values.push(filter.storeLocation); clauses.push(`store_location = $${values.length}`); }
    if (filter.cashierId) { values.push(filter.cashierId); clauses.push(`cashier_id = $${values.length}`); }
    const { rows } = await pool.query<SessionRow>(
      `SELECT * FROM register_sessions WHERE ${clauses.join(' AND ')} ORDER BY business_date DESC LIMIT 200`,
      values,
    );
    return rows.map(toSession);
  }
}
