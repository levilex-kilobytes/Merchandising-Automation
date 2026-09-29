CREATE TABLE IF NOT EXISTS putaway_tasks (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goods_received_note_id  UUID NOT NULL,
  product_code            VARCHAR(100) NOT NULL,
  product_name            VARCHAR(255) NOT NULL,
  quantity                INTEGER NOT NULL CHECK (quantity > 0),
  assigned_bin            VARCHAR(50) NOT NULL REFERENCES locations(code),
  status                  VARCHAR(20) NOT NULL DEFAULT 'pending',
  notes                   TEXT,
  completed_at            TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_putaway_grn ON putaway_tasks(goods_received_note_id);
CREATE INDEX idx_putaway_status ON putaway_tasks(status);
