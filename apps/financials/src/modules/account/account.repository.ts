import { PoolClient } from 'pg';
import { pool } from '../../config/database';

export interface Account {
  id: string; code: string; name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  normalBalance: 'debit' | 'credit';
  isActive: boolean;
}

interface Row {
  id: string; code: string; name: string; type: string;
  normal_balance: string; is_active: boolean;
}

function toAccount(r: Row): Account {
  return {
    id: r.id, code: r.code, name: r.name,
    type: r.type as Account['type'],
    normalBalance: r.normal_balance as Account['normalBalance'],
    isActive: r.is_active,
  };
}

export class AccountRepository {
  async list(): Promise<Account[]> {
    const { rows } = await pool.query<Row>(`SELECT * FROM accounts WHERE is_active = TRUE ORDER BY code`);
    return rows.map(toAccount);
  }
  async findByCode(code: string, tx?: PoolClient): Promise<Account | null> {
    const client = tx ?? pool;
    const { rows } = await client.query<Row>(`SELECT * FROM accounts WHERE code = $1`, [code]);
    return rows[0] ? toAccount(rows[0]) : null;
  }
  async findById(id: string, tx?: PoolClient): Promise<Account | null> {
    const client = tx ?? pool;
    const { rows } = await client.query<Row>(`SELECT * FROM accounts WHERE id = $1`, [id]);
    return rows[0] ? toAccount(rows[0]) : null;
  }
}
