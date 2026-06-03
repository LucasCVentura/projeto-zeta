ALTER TABLE "procedures" ADD COLUMN "commission_pct" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "commission_amount" integer;