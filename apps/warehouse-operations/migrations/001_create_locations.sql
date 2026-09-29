CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS locations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        VARCHAR(50) NOT NULL UNIQUE,
  zone        VARCHAR(20) NOT NULL,
  aisle       VARCHAR(20) NOT NULL,
  rack        VARCHAR(20) NOT NULL,
  shelf       VARCHAR(20) NOT NULL,
  bin         VARCHAR(20) NOT NULL,
  capacity    INTEGER NOT NULL DEFAULT 1000,
  used        INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (used >= 0),
  CHECK (capacity >= 0)
);

CREATE INDEX idx_locations_zone ON locations(zone);
CREATE INDEX idx_locations_code ON locations(code);
