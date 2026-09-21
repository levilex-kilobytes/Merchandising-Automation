CREATE TABLE IF NOT EXISTS supplier_products (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id         UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    product_code        VARCHAR(100) NOT NULL,
    product_name        VARCHAR(255) NOT NULL,
    unit_cost           NUMERIC(14,2) NOT NULL,
    currency            VARCHAR(3) NOT NULL DEFAULT 'KES',
    lead_time_days      INTEGER NOT NULL DEFAULT 7,
    min_order_qty       INTEGER NOT NULL DEFAULT 1,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    valid_from          DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_to            DATE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (supplier_id, product_code)
);
CREATE INDEX IF NOT EXISTS idx_supplier_products_supplier ON supplier_products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_products_code     ON supplier_products(product_code);
