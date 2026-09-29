CREATE TABLE IF NOT EXISTS physical_counts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  register_session_id UUID NOT NULL REFERENCES register_sessions(id) ON DELETE CASCADE,
  cash_counted        NUMERIC(14,2) NOT NULL DEFAULT 0,
  card_counted        NUMERIC(14,2) NOT NULL DEFAULT 0,
  other_counted       NUMERIC(14,2) NOT NULL DEFAULT 0,
  counted_by          VARCHAR(100),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reconciliations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  register_session_id UUID NOT NULL REFERENCES register_sessions(id) ON DELETE CASCADE,
  expected_total      NUMERIC(14,2) NOT NULL,
  counted_total       NUMERIC(14,2) NOT NULL,
  overage             NUMERIC(14,2) NOT NULL DEFAULT 0,
  shortage            NUMERIC(14,2) NOT NULL DEFAULT 0,
  explanation         TEXT,
  signed_off_by       VARCHAR(100),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reconciliations_session ON reconciliations(register_session_id);
