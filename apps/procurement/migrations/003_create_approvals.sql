CREATE TABLE IF NOT EXISTS approvals (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_id           UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    approved_by     VARCHAR(255) NOT NULL,
    note            TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_approvals_po ON approvals(po_id);
