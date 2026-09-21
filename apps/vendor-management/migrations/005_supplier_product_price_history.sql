CREATE TABLE IF NOT EXISTS supplier_product_price_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id     UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    product_code    VARCHAR(100) NOT NULL,
    old_cost        NUMERIC(14,2),
    new_cost        NUMERIC(14,2) NOT NULL,
    currency        VARCHAR(3) NOT NULL DEFAULT 'KES',
    effective_from  DATE NOT NULL DEFAULT CURRENT_DATE,
    changed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    changed_by      UUID
);
CREATE INDEX IF NOT EXISTS idx_spph_supplier_product
    ON supplier_product_price_history(supplier_id, product_code, changed_at DESC);
