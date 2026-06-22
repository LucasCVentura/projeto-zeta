ALTER TABLE "whatsapp_system_template_settings"
  ADD COLUMN IF NOT EXISTS "testimonial_outreach_template_id" text;

ALTER TABLE "whatsapp_system_template_settings"
  ADD COLUMN IF NOT EXISTS "winback_outreach_template_id" text;
