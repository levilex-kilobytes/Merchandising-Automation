CREATE TABLE IF NOT EXISTS retail_prices (
  product_code  VARCHAR(100) PRIMARY KEY,
  product_name  VARCHAR(255) NOT NULL,
  unit_price    NUMERIC(14,2) NOT NULL,
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO retail_prices (product_code, product_name, unit_price) VALUES
  ('PROD-X', 'Widget X', 999.00),
  ('PD005',  'Widget 5', 499.00),
  ('PD002',  'Sugar 2kg', 250.00),
  ('PD003',  'Cooking Oil 1L', 320.00)
ON CONFLICT (product_code) DO NOTHING;
