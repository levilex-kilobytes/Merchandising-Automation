export interface JournalLine {
  id: string;
  entryId: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description: string | null;
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  entryDate: string;
  description: string | null;
  referenceType: string | null;
  referenceId: string | null;
  status: string;
  postedAt: Date;
  createdAt: Date;
  lines?: JournalLine[];
}

export interface CreateJournalEntryLine {
  accountCode: string;
  debit?: number;
  credit?: number;
  description?: string;
}

export interface CreateJournalEntryInput {
  entryDate?: string;
  description?: string;
  referenceType?: string;
  referenceId?: string;
  lines: CreateJournalEntryLine[];
}
