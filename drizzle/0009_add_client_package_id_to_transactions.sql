CREATE TABLE IF NOT EXISTS "transactions" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL,
  "professional_id" text NOT NULL,
  "appointment_id" text,
  "amount" integer NOT NULL,
  "description" text,
  "date" date NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'transactions_organization_id_organizations_id_fk'
  ) THEN
    ALTER TABLE "transactions"
      ADD CONSTRAINT "transactions_organization_id_organizations_id_fk"
      FOREIGN KEY ("organization_id")
      REFERENCES "public"."organizations"("id")
      ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'transactions_professional_id_users_id_fk'
  ) THEN
    ALTER TABLE "transactions"
      ADD CONSTRAINT "transactions_professional_id_users_id_fk"
      FOREIGN KEY ("professional_id")
      REFERENCES "public"."users"("id")
      ON DELETE restrict ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'transactions_appointment_id_appointments_id_fk'
  ) THEN
    ALTER TABLE "transactions"
      ADD CONSTRAINT "transactions_appointment_id_appointments_id_fk"
      FOREIGN KEY ("appointment_id")
      REFERENCES "public"."appointments"("id")
      ON DELETE set null ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "client_package_id" text;
