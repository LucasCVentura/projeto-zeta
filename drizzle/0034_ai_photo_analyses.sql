CREATE TABLE "ai_photo_analyses" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "photo_key" text NOT NULL,
  "analysis_type" text NOT NULL,
  "analysis" text NOT NULL,
  "image_url" text,
  "areas" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX "ai_photo_analyses_key_idx" ON "ai_photo_analyses" ("organization_id", "photo_key", "analysis_type");
