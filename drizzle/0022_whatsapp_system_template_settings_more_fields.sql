ALTER TABLE "whatsapp_system_template_settings"
  ADD COLUMN IF NOT EXISTS "package_summary_template_id" text,
  ADD COLUMN IF NOT EXISTS "reminder_confirmation_template_id" text,
  ADD COLUMN IF NOT EXISTS "post_visit_template_id" text;
