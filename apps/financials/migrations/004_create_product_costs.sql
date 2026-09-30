CREATE TABLE IF NOT EXISTS product_costs (
  product_code   VARCHAR(100) PRIMARY KEY,
  unit_cost      NUMERIC(14,2) NOT NULL,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
