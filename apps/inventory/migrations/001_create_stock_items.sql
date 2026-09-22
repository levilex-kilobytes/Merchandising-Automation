CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS stock_items (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_code      VARCHAR(100) NOT NULL,
    product_name      VARCHAR(255) NOT NULL,
    location_code     VARCHAR(50) NOT NULL,
    on_hand           INTEGER NOT NULL DEFAULT 0,
    allocated         INTEGER NOT NULL DEFAULT 0,
    on_order          INTEGER NOT NULL DEFAULT 0,
    unit_cost         NUMERIC(14,2) NOT NULL DEFAULT 0,
    low_stock_threshold INTEGER NOT NULL DEFAULT 20,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (product_code, location_code)
);

CREATE INDEX IF NOT EXISTS idx_stock_product ON stock_items(product_code);
CREATE INDEX IF NOT EXISTS idx_stock_location ON stock_items(location_code);
