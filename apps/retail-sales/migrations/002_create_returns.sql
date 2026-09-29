CREATE TABLE IF NOT EXISTS returns (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_number     VARCHAR(50) NOT NULL UNIQUE,
  original_sale_id  UUID NOT NULL REFERENCES sales(id),
  store_location    VARCHAR(100) NOT NULL,
  reason            TEXT,
  refund_total      NUMERIC(14,2) NOT NULL DEFAULT 0,
  status            VARCHAR(20) NOT NULL DEFAULT 'completed',
  completed_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS return_lines (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id      UUID NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
  product_code   VARCHAR(100) NOT NULL,
  quantity       INTEGER NOT NULL CHECK (quantity > 0),
  refund_amount  NUMERIC(14,2) NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_returns_sale ON returns(original_sale_id);
