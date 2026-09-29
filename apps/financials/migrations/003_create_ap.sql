CREATE TABLE IF NOT EXISTS supplier_bills (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_number    VARCHAR(50) NOT NULL UNIQUE,
  supplier_id    UUID NOT NULL,
  supplier_name  VARCHAR(255) NOT NULL,
  grn_id         UUID,
  amount         NUMERIC(14,2) NOT NULL,
  paid_amount    NUMERIC(14,2) NOT NULL DEFAULT 0,
  status         VARCHAR(20) NOT NULL DEFAULT 'open',
  due_date       DATE NOT NULL,
  issued_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at        TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bills_supplier ON supplier_bills(supplier_id);
CREATE INDEX idx_bills_status ON supplier_bills(status);
CREATE INDEX idx_bills_due ON supplier_bills(due_date);
