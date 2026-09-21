CREATE TABLE IF NOT EXISTS po_lines (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_id           UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_code    VARCHAR(100) NOT NULL,
    product_name    VARCHAR(255) NOT NULL,
    ordered_qty     INTEGER NOT NULL,
    received_qty    INTEGER NOT NULL DEFAULT 0,
    unit_cost       NUMERIC(14,2) NOT NULL,
    line_total      NUMERIC(14,2) NOT NULL,
    lead_time_days  INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (po_id, product_code)
);

CREATE INDEX IF NOT EXISTS idx_po_lines_po ON po_lines(po_id);
