CREATE TABLE IF NOT EXISTS "whatsapp_pending_confirmations" (
  "id" text PRIMARY KEY NOT NULL,
  "message_id" text NOT NULL UNIQUE,
  "appointment_id" text REFERENCES "appointments"("id") ON DELETE CASCADE,
  "client_package_id" text REFERENCES "client_packages"("id") ON DELETE CASCADE,
  "organization_id" text NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "expires_at" timestamp NOT NULL
);
