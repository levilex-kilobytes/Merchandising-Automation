CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS grns (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_id           UUID NOT NULL,
    supplier_id     UUID NOT NULL,
    supplier_name   VARCHAR(255) NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'draft',
    received_at     TIMESTAMPTZ,
    shortages       INTEGER NOT NULL DEFAULT 0,
    overages        INTEGER NOT NULL DEFAULT 0,
    damages         INTEGER NOT NULL DEFAULT 0,
    notes           TEXT,
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grns_po ON grns(po_id);
CREATE INDEX IF NOT EXISTS idx_grns_status ON grns(status);
