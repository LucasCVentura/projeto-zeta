CREATE TABLE IF NOT EXISTS "whatsapp_message_logs" (
  "id" text PRIMARY KEY NOT NULL,
  "message_id" text,
  "organization_id" text REFERENCES "organizations"("id") ON DELETE CASCADE,
  "client_id" text REFERENCES "clients"("id") ON DELETE SET NULL,
  "destination" text,
  "template_id" text,
  "event_type" text NOT NULL DEFAULT 'submitted',
  "error" text,
  "payload" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "whatsapp_message_logs_message_id_uniq"
  ON "whatsapp_message_logs" ("message_id");

CREATE INDEX IF NOT EXISTS "whatsapp_message_logs_created_at_idx"
  ON "whatsapp_message_logs" ("created_at");
