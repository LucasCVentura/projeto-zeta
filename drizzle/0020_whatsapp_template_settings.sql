CREATE TABLE IF NOT EXISTS "whatsapp_template_settings" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "booking_summary_template_id" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "whatsapp_template_settings_org_uniq"
  ON "whatsapp_template_settings" ("organization_id");
