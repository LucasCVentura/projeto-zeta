ALTER TABLE "procedures" ADD COLUMN IF NOT EXISTS "has_return" boolean NOT NULL DEFAULT false;
ALTER TABLE "procedures" ADD COLUMN IF NOT EXISTS "return_interval_days" integer;
