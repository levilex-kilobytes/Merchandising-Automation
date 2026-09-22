CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS purchase_orders (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id         UUID NOT NULL,
    supplier_name       VARCHAR(255) NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'draft',
    currency            VARCHAR(3) NOT NULL,
    total_cost          NUMERIC(14,2) NOT NULL DEFAULT 0,
    expected_date       DATE NOT NULL,
    notes               TEXT,
    approved_by         VARCHAR(255),
    approved_at         TIMESTAMPTZ,
    sent_at             TIMESTAMPTZ,
    closed_at           TIMESTAMPTZ,
    cancelled_at        TIMESTAMPTZ,
    cancellation_reason TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_po_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_po_supplier ON purchase_orders(supplier_id);
