CREATE TABLE IF NOT EXISTS "client_documents" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "client_id" text NOT NULL REFERENCES "clients"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "url" text NOT NULL,
  "file_type" text NOT NULL,
  "file_size" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
