CREATE TABLE IF NOT EXISTS reservations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_code    VARCHAR(100) NOT NULL,
    location_code   VARCHAR(50) NOT NULL,
    quantity        INTEGER NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'active',
    reference_id    VARCHAR(100),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    released_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_reservations_product ON reservations(product_code, location_code);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
