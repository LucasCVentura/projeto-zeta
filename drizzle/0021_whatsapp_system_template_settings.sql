CREATE TABLE IF NOT EXISTS "whatsapp_system_template_settings" (
  "id" text PRIMARY KEY NOT NULL,
  "singleton_key" text NOT NULL UNIQUE,
  "booking_summary_template_id" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
