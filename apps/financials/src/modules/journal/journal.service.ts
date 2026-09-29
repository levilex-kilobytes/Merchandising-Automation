import { PoolClient } from 'pg';
import { JournalRepository } from './journal.repository';
import { AccountRepository } from '../account/account.repository';
import { OutboxRepository } from '../../shared/outbox.repository';
import { generateEntryNumber } from '../../shared/generate-number';
import { JournalEntry, CreateJournalEntryInput } from './journal.types';
import { ValidationError, NotFoundError } from '@mfa/errors';

export class JournalService {
  constructor(
    private readonly repo = new JournalRepository(),
    private readonly accounts = new AccountRepository(),
    private readonly outbox = new OutboxRepository(),
  ) {}

  async post(input: CreateJournalEntryInput): Promise<JournalEntry> {
    if (!input.lines.length) throw new ValidationError('Journal entry must have at least one line');

    let totalDebit = 0;
    let totalCredit = 0;
    for (const l of input.lines) {
      totalDebit += l.debit ?? 0;
      totalCredit += l.credit ?? 0;
    }
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new ValidationError(`Journal entry is unbalanced: debits ${totalDebit.toFixed(2)} vs credits ${totalCredit.toFixed(2)}`);
    }

    const entryDate = input.entryDate ?? new Date().toISOString().slice(0, 10);
    const entryNumber = generateEntryNumber();

    return this.repo.withTransaction(async (tx) => {
      const entry = await this.repo.create(tx, {
        entryNumber, entryDate,
        description: input.description ?? null,
        referenceType: input.referenceType ?? null,
        referenceId: input.referenceId ?? null,
      });

      for (const l of input.lines) {
        const acct = await this.accounts.findByCode(l.accountCode, tx);
        if (!acct) throw new NotFoundError(`Account ${l.accountCode} not found`);
        await this.repo.addLine(tx, entry.id, {
          accountId: acct.id,
          debit: Number((l.debit ?? 0).toFixed(2)),
          credit: Number((l.credit ?? 0).toFixed(2)),
          description: l.description ?? null,
        });
      }

      await this.outbox.enqueue(tx, {
        eventType: 'financials.journal-entry.posted',
        aggregateId: entry.id,
        payload: {
          entryId: entry.id,
          entryNumber,
          entryDate,
          description: entry.description,
          referenceType: entry.referenceType,
          referenceId: entry.referenceId,
          totalDebit: Number(totalDebit.toFixed(2)),
        },
      });

      const full = await this.repo.findById(entry.id, tx);
      if (!full) throw new Error(`Failed to load created entry ${entry.id}`);
      return full;
    });
  }

  async postFromEvent(tx: PoolClient, input: CreateJournalEntryInput): Promise<void> {
    // Idempotency: if we already posted for this reference, skip silently
    if (input.referenceType && input.referenceId) {
      const exists = await this.repo.existsFor(input.referenceType, input.referenceId, tx);
      if (exists) {
        return;
      }
    }
    // Same validation as post() but reuses the caller's transaction
    if (!input.lines.length) throw new ValidationError('Journal entry must have at least one line');
    let totalDebit = 0, totalCredit = 0;
    for (const l of input.lines) {
      totalDebit += l.debit ?? 0;
      totalCredit += l.credit ?? 0;
    }
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new ValidationError(`Unbalanced entry: debits ${totalDebit.toFixed(2)} vs credits ${totalCredit.toFixed(2)}`);
    }
    const entryDate = input.entryDate ?? new Date().toISOString().slice(0, 10);
    const entryNumber = generateEntryNumber();
    const entry = await this.repo.create(tx, {
      entryNumber, entryDate,
      description: input.description ?? null,
      referenceType: input.referenceType ?? null,
      referenceId: input.referenceId ?? null,
    });
    for (const l of input.lines) {
      const acct = await this.accounts.findByCode(l.accountCode, tx);
      if (!acct) throw new NotFoundError(`Account ${l.accountCode} not found`);
      await this.repo.addLine(tx, entry.id, {
        accountId: acct.id,
        debit: Number((l.debit ?? 0).toFixed(2)),
        credit: Number((l.credit ?? 0).toFixed(2)),
        description: l.description ?? null,
      });
    }
    await this.outbox.enqueue(tx, {
      eventType: 'financials.journal-entry.posted',
      aggregateId: entry.id,
      payload: {
        entryId: entry.id, entryNumber, entryDate,
        referenceType: entry.referenceType, referenceId: entry.referenceId,
        totalDebit: Number(totalDebit.toFixed(2)),
      },
    });
  }

  async get(id: string): Promise<JournalEntry> {
    const e = await this.repo.findById(id);
    if (!e) throw new NotFoundError(`Journal entry ${id} not found`);
    return e;
  }

  async list(filter: { referenceType?: string; referenceId?: string; fromDate?: string; toDate?: string }): Promise<JournalEntry[]> {
    return this.repo.list(filter);
  }
}
