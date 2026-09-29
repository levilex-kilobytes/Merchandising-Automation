CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS sales (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_number     VARCHAR(50) NOT NULL UNIQUE,
  store_location  VARCHAR(100) NOT NULL,
  cashier_id      VARCHAR(100),
  subtotal        NUMERIC(14,2) NOT NULL DEFAULT 0,
  discount_total  NUMERIC(14,2) NOT NULL DEFAULT 0,
  tax_total       NUMERIC(14,2) NOT NULL DEFAULT 0,
  grand_total     NUMERIC(14,2) NOT NULL DEFAULT 0,
  status          VARCHAR(20) NOT NULL DEFAULT 'completed',
  completed_at    TIMESTAMPTZ,
  voided_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sale_lines (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id         UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_code    VARCHAR(100) NOT NULL,
  product_name    VARCHAR(255) NOT NULL,
  quantity        INTEGER NOT NULL CHECK (quantity > 0),
  unit_price      NUMERIC(14,2) NOT NULL,
  discount_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  line_total      NUMERIC(14,2) NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id      UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  method       VARCHAR(30) NOT NULL,
  amount       NUMERIC(14,2) NOT NULL,
  reference    VARCHAR(255),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sales_store ON sales(store_location);
CREATE INDEX idx_sales_status ON sales(status);
CREATE INDEX idx_sale_lines_sale ON sale_lines(sale_id);
CREATE INDEX idx_payments_sale ON payments(sale_id);
