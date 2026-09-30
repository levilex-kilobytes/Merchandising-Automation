import { PoolClient } from 'pg';
import { pool, withTransaction } from '../../config/database';
import { JournalEntry, JournalLine } from './journal.types';

interface EntryRow {
  id: string; entry_number: string; entry_date: Date; description: string | null;
  reference_type: string | null; reference_id: string | null;
  status: string; posted_at: Date; created_at: Date;
}
interface LineRow {
  id: string; entry_id: string; account_id: string; account_code: string;
  account_name: string; debit: string; credit: string; description: string | null;
}

const toEntry = (r: EntryRow, lines?: LineRow[]): JournalEntry => ({
  id: r.id,
  entryNumber: r.entry_number,
  entryDate: r.entry_date instanceof Date ? r.entry_date.toISOString().slice(0, 10) : String(r.entry_date),
  description: r.description,
  referenceType: r.reference_type,
  referenceId: r.reference_id,
  status: r.status,
  postedAt: r.posted_at,
  createdAt: r.created_at,
  lines: lines?.map(toLine),
});

const toLine = (r: LineRow): JournalLine => ({
  id: r.id, entryId: r.entry_id, accountId: r.account_id,
  accountCode: r.account_code, accountName: r.account_name,
  debit: Number(r.debit), credit: Number(r.credit), description: r.description,
});

export class JournalRepository {
  withTransaction = withTransaction;

  async create(tx: PoolClient, input: {
    entryNumber: string; entryDate: string; description: string | null;
    referenceType: string | null; referenceId: string | null;
  }): Promise<JournalEntry> {
    const { rows } = await tx.query<EntryRow>(
      `INSERT INTO journal_entries (entry_number, entry_date, description, reference_type, reference_id, status)
       VALUES ($1,$2,$3,$4,$5,'posted') RETURNING *`,
      [input.entryNumber, input.entryDate, input.description, input.referenceType, input.referenceId],
    );
    return toEntry(rows[0]);
  }

  async addLine(tx: PoolClient, entryId: string, line: {
    accountId: string; debit: number; credit: number; description: string | null;
  }): Promise<void> {
    await tx.query(
      `INSERT INTO journal_lines (entry_id, account_id, debit, credit, description)
       VALUES ($1,$2,$3,$4,$5)`,
      [entryId, line.accountId, line.debit, line.credit, line.description],
    );
  }

  async findById(id: string, tx?: PoolClient): Promise<JournalEntry | null> {
    const client = tx ?? pool;
    const { rows } = await client.query<EntryRow>(`SELECT * FROM journal_entries WHERE id = $1`, [id]);
    if (!rows[0]) return null;
    const { rows: lines } = await client.query<LineRow>(
      `SELECT jl.*, a.code AS account_code, a.name AS account_name
       FROM journal_lines jl JOIN accounts a ON a.id = jl.account_id
       WHERE jl.entry_id = $1 ORDER BY jl.created_at`,
      [id],
    );
    return toEntry(rows[0], lines);
  }

  async existsFor(referenceType: string, referenceId: string, tx?: PoolClient): Promise<boolean> {
    const client = tx ?? pool;
    const { rowCount } = await client.query(
      `SELECT 1 FROM journal_entries WHERE reference_type = $1 AND reference_id = $2 LIMIT 1`,
      [referenceType, referenceId],
    );
    return (rowCount ?? 0) > 0;
  }

  async list(filter: { referenceType?: string; referenceId?: string; fromDate?: string; toDate?: string }): Promise<JournalEntry[]> {
    const clauses: string[] = [];
    const values: unknown[] = [];
    if (filter.referenceType) { values.push(filter.referenceType); clauses.push(`reference_type = $${values.length}`); }
    if (filter.referenceId) { values.push(filter.referenceId); clauses.push(`reference_id = $${values.length}`); }
    if (filter.fromDate) { values.push(filter.fromDate); clauses.push(`entry_date >= $${values.length}`); }
    if (filter.toDate) { values.push(filter.toDate); clauses.push(`entry_date <= $${values.length}`); }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const { rows } = await pool.query<EntryRow>(
      `SELECT * FROM journal_entries ${where} ORDER BY entry_date DESC, posted_at DESC LIMIT 200`,
      values,
    );
    return rows.map((r) => toEntry(r));
  }
}
