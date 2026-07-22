DO $$ BEGIN
  CREATE TYPE coupon_kind AS ENUM ('discount', 'gift');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE coupon_recipient_status AS ENUM ('pending', 'sent', 'failed', 'redeemed', 'expired');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS coupons (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  kind coupon_kind NOT NULL DEFAULT 'discount',
  procedure_id text NOT NULL REFERENCES procedures(id) ON DELETE CASCADE,
  discount_pct integer NOT NULL,
  quantity integer NOT NULL,
  expires_at date NOT NULL,
  created_by_id text REFERENCES users(id),
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS coupon_recipients (
  id text PRIMARY KEY,
  coupon_id text NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  organization_id text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id text NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  status coupon_recipient_status NOT NULL DEFAULT 'pending',
  sent_at timestamp,
  redeemed_at timestamp,
  redeemed_appointment_id text REFERENCES appointments(id) ON DELETE SET NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  UNIQUE (coupon_id, client_id)
);
CREATE INDEX IF NOT EXISTS coupon_recipients_status_idx ON coupon_recipients (status, created_at);

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS coupon_recipient_id text REFERENCES coupon_recipients(id) ON DELETE SET NULL;

ALTER TABLE whatsapp_system_template_settings
  ADD COLUMN IF NOT EXISTS coupon_send_template_id text,
  ADD COLUMN IF NOT EXISTS gift_voucher_send_template_id text;
