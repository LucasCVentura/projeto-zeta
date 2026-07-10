ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "daily_agenda_whatsapp" boolean NOT NULL DEFAULT false;

ALTER TABLE "whatsapp_system_template_settings"
  ADD COLUMN IF NOT EXISTS "daily_agenda_template_id" text;
