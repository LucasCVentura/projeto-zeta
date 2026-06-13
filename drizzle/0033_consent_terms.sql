CREATE TABLE IF NOT EXISTS "consent_terms" (
  "id" text PRIMARY KEY NOT NULL,
  "org_id" text NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "title" text NOT NULL,
  "body" text NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "display_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "consent_term_records" (
  "id" text PRIMARY KEY NOT NULL,
  "client_id" text NOT NULL REFERENCES "clients"("id") ON DELETE CASCADE,
  "org_id" text NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "term_id" text NOT NULL REFERENCES "consent_terms"("id") ON DELETE CASCADE,
  "accepted" boolean NOT NULL,
  "responded_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "consent_term_records_client_term_unique" UNIQUE("client_id", "term_id")
);
