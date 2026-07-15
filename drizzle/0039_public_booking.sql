CREATE UNIQUE INDEX IF NOT EXISTS clients_org_phone_unique
  ON clients (organization_id, phone)
  WHERE phone IS NOT NULL;

CREATE TABLE IF NOT EXISTS "public_booking_attempts" (
  "id"              text PRIMARY KEY,
  "organization_id" text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  "ip"              text NOT NULL,
  "phone"           text,
  "success"         boolean NOT NULL,
  "created_at"      timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS public_booking_attempts_ip_idx ON public_booking_attempts (ip, created_at);
CREATE INDEX IF NOT EXISTS public_booking_attempts_phone_idx ON public_booking_attempts (phone, created_at);
