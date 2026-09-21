CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS suppliers (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(255) NOT NULL UNIQUE,
    legal_name          VARCHAR(255),
    tax_id              VARCHAR(50),
    status              VARCHAR(20) NOT NULL DEFAULT 'active',
    email               VARCHAR(255),
    phone               VARCHAR(50),
    address_line1       VARCHAR(255),
    address_line2       VARCHAR(255),
    city                VARCHAR(100),
    country             VARCHAR(100) DEFAULT 'Kenya',
    payment_terms       VARCHAR(50) NOT NULL,
    default_currency    VARCHAR(3) NOT NULL DEFAULT 'KES',
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
