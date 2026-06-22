CREATE TABLE IF NOT EXISTS "trial_reactivation_tokens" (
  "id"              text PRIMARY KEY,
  "token"           text NOT NULL UNIQUE,
  "organization_id" text NOT NULL,
  "used_at"         timestamp,
  "expires_at"      timestamp NOT NULL,
  "created_at"      timestamp NOT NULL DEFAULT now()
);
