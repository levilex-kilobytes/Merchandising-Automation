CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS registers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            VARCHAR(50) NOT NULL UNIQUE,
  store_location  VARCHAR(100) NOT NULL,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS register_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  register_code   VARCHAR(50) NOT NULL,
  store_location  VARCHAR(100) NOT NULL,
  business_date   DATE NOT NULL,
  cashier_id      VARCHAR(100),
  status          VARCHAR(20) NOT NULL DEFAULT 'open',
  expected_total  NUMERIC(14,2) NOT NULL DEFAULT 0,
  counted_total   NUMERIC(14,2) NOT NULL DEFAULT 0,
  difference      NUMERIC(14,2) NOT NULL DEFAULT 0,
  opened_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (register_code, business_date)
);

CREATE INDEX idx_sessions_store_date ON register_sessions(store_location, business_date);
CREATE INDEX idx_sessions_status ON register_sessions(status);
