CREATE TABLE IF NOT EXISTS grn_lines (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grn_id            UUID NOT NULL REFERENCES grns(id) ON DELETE CASCADE,
    product_code      VARCHAR(100) NOT NULL,
    product_name      VARCHAR(255) NOT NULL,
    ordered_qty       INTEGER NOT NULL,
    received_qty      INTEGER NOT NULL DEFAULT 0,
    damaged_qty       INTEGER NOT NULL DEFAULT 0,
    condition         VARCHAR(20) NOT NULL DEFAULT 'good',
    unit_cost         NUMERIC(14,2) NOT NULL,
    line_total        NUMERIC(14,2) NOT NULL DEFAULT 0,
    notes             TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (grn_id, product_code)
);

CREATE INDEX IF NOT EXISTS idx_grn_lines_grn ON grn_lines(grn_id);
