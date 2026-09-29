CREATE TABLE IF NOT EXISTS pick_tasks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_code  VARCHAR(100) NOT NULL,
  product_name  VARCHAR(255) NOT NULL,
  quantity      INTEGER NOT NULL CHECK (quantity > 0),
  from_bin      VARCHAR(50) NOT NULL REFERENCES locations(code),
  to_location   VARCHAR(100) NOT NULL,
  status        VARCHAR(20) NOT NULL DEFAULT 'pending',
  notes         TEXT,
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pick_status ON pick_tasks(status);
