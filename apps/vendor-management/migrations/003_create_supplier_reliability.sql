CREATE TABLE IF NOT EXISTS supplier_reliability (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id         UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    period_start        DATE NOT NULL,
    period_end          DATE NOT NULL,
    orders_total        INTEGER NOT NULL DEFAULT 0,
    orders_on_time      INTEGER NOT NULL DEFAULT 0,
    orders_late         INTEGER NOT NULL DEFAULT 0,
    orders_short        INTEGER NOT NULL DEFAULT 0,
    orders_damaged      INTEGER NOT NULL DEFAULT 0,
    on_time_rate        NUMERIC(5,2),
    quality_rate        NUMERIC(5,2),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (supplier_id, period_start, period_end)
);
