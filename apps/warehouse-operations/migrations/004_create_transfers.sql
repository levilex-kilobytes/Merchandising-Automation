CREATE TABLE IF NOT EXISTS transfers (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_location  VARCHAR(100) NOT NULL,
  to_location    VARCHAR(100) NOT NULL,
  status         VARCHAR(20) NOT NULL DEFAULT 'draft',
  notes          TEXT,
  dispatched_at  TIMESTAMPTZ,
  received_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transfer_lines (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id   UUID NOT NULL REFERENCES transfers(id) ON DELETE CASCADE,
  product_code  VARCHAR(100) NOT NULL,
  product_name  VARCHAR(255) NOT NULL,
  quantity      INTEGER NOT NULL CHECK (quantity > 0),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transfers_status ON transfers(status);
CREATE INDEX idx_transfer_lines_transfer ON transfer_lines(transfer_id);
