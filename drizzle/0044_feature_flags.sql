-- Substitui a coluna específica organizations.coupons_enabled (migration 0043) por um
-- mecanismo genérico de feature flags — reutilizável pra qualquer feature grande nova,
-- não só cupons. Ver src/lib/feature-flags.ts.

ALTER TABLE organizations DROP COLUMN IF EXISTS coupons_enabled;

CREATE TABLE IF NOT EXISTS feature_flags (
  id text PRIMARY KEY,
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  description text,
  enabled_for_all boolean NOT NULL DEFAULT false,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS feature_flag_orgs (
  feature_flag_id text NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
  organization_id text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY (feature_flag_id, organization_id)
);
