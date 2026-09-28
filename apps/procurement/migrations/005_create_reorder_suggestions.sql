CREATE TABLE IF NOT EXISTS reorder_suggestions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_code        VARCHAR(100) NOT NULL,
  product_name        VARCHAR(255) NOT NULL,
  supplier_id         UUID NOT NULL,
  supplier_name       VARCHAR(255) NOT NULL,
  suggested_quantity  INTEGER NOT NULL,
  unit_cost           NUMERIC(14,2) NOT NULL,
  currency            VARCHAR(3) NOT NULL,
  lead_time_days      INTEGER NOT NULL DEFAULT 0,
  reason              TEXT NOT NULL,
  status              VARCHAR(20) NOT NULL DEFAULT 'pending',
  converted_po_id     UUID,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reorder_status ON reorder_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_reorder_product ON reorder_suggestions(product_code, status);

-- Only one pending suggestion per product at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_reorder_pending_unique
  ON reorder_suggestions(product_code)
  WHERE status = 'pending';
