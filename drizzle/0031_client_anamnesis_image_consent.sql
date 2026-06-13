ALTER TABLE "client_anamnesis"
  ADD COLUMN IF NOT EXISTS "image_consent" boolean,
  ADD COLUMN IF NOT EXISTS "image_consent_at" timestamp;
