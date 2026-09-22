CREATE TABLE IF NOT EXISTS stock_movements (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_code    VARCHAR(100) NOT NULL,
    location_code   VARCHAR(50) NOT NULL,
    movement_type   VARCHAR(30) NOT NULL,
    quantity        INTEGER NOT NULL,
    reference_id    VARCHAR(100),
    reference_type  VARCHAR(50),
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_movements_product ON stock_movements(product_code);
