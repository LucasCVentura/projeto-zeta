-- organizations: stripe & subscription columns (created directly in prod, missing from migrations)
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "stripe_customer_id" text;
--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "stripe_subscription_id" text;
--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "subscription_status" text NOT NULL DEFAULT 'trialing';
--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "trial_ends_at" timestamp;
--> statement-breakpoint

-- appointments: client_package_id reference (without FK to avoid circularity)
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "client_package_id" text;
--> statement-breakpoint

-- client_anamnesis: aesthetic_goal field added to schema but missing from migration 0004
ALTER TABLE "client_anamnesis" ADD COLUMN IF NOT EXISTS "aesthetic_goal" text;
