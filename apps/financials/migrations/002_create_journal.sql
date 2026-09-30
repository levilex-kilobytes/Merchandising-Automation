CREATE TABLE IF NOT EXISTS journal_entries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_number    VARCHAR(50) NOT NULL UNIQUE,
  entry_date      DATE NOT NULL,
  description     TEXT,
  reference_type  VARCHAR(50),
  reference_id    VARCHAR(100),
  status          VARCHAR(20) NOT NULL DEFAULT 'posted',
  posted_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS journal_lines (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id     UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  account_id   UUID NOT NULL REFERENCES accounts(id),
  debit        NUMERIC(14,2) NOT NULL DEFAULT 0,
  credit       NUMERIC(14,2) NOT NULL DEFAULT 0,
  description  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (debit >= 0),
  CHECK (credit >= 0),
  CHECK (debit = 0 OR credit = 0)
);

CREATE INDEX idx_journal_entries_date ON journal_entries(entry_date);
CREATE INDEX idx_journal_entries_ref ON journal_entries(reference_type, reference_id);
CREATE INDEX idx_journal_lines_entry ON journal_lines(entry_id);
CREATE INDEX idx_journal_lines_account ON journal_lines(account_id);
