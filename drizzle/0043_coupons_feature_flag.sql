ALTER TABLE organizations ADD COLUMN IF NOT EXISTS coupons_enabled boolean NOT NULL DEFAULT false;
