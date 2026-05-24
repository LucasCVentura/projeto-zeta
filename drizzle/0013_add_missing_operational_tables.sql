CREATE TABLE IF NOT EXISTS "client_photos" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL,
  "client_id" text NOT NULL,
  "url" text NOT NULL,
  "procedure_id" text,
  "procedure" text,
  "notes" text,
  "taken_at" date NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'client_photos_organization_id_organizations_id_fk'
  ) THEN
    ALTER TABLE "client_photos"
      ADD CONSTRAINT "client_photos_organization_id_organizations_id_fk"
      FOREIGN KEY ("organization_id")
      REFERENCES "public"."organizations"("id")
      ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'client_photos_client_id_clients_id_fk'
  ) THEN
    ALTER TABLE "client_photos"
      ADD CONSTRAINT "client_photos_client_id_clients_id_fk"
      FOREIGN KEY ("client_id")
      REFERENCES "public"."clients"("id")
      ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'client_photos_procedure_id_procedures_id_fk'
  ) THEN
    ALTER TABLE "client_photos"
      ADD CONSTRAINT "client_photos_procedure_id_procedures_id_fk"
      FOREIGN KEY ("procedure_id")
      REFERENCES "public"."procedures"("id")
      ON DELETE set null ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "packages" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL,
  "procedure_id" text NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "total_sessions" integer NOT NULL DEFAULT 4,
  "price" integer NOT NULL DEFAULT 0,
  "cost" integer NOT NULL DEFAULT 0,
  "active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'packages_organization_id_organizations_id_fk'
  ) THEN
    ALTER TABLE "packages"
      ADD CONSTRAINT "packages_organization_id_organizations_id_fk"
      FOREIGN KEY ("organization_id")
      REFERENCES "public"."organizations"("id")
      ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'packages_procedure_id_procedures_id_fk'
  ) THEN
    ALTER TABLE "packages"
      ADD CONSTRAINT "packages_procedure_id_procedures_id_fk"
      FOREIGN KEY ("procedure_id")
      REFERENCES "public"."procedures"("id")
      ON DELETE restrict ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "client_packages" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL,
  "client_id" text NOT NULL,
  "package_id" text NOT NULL,
  "sessions_used" integer NOT NULL DEFAULT 0,
  "purchased_at" date NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'client_packages_organization_id_organizations_id_fk'
  ) THEN
    ALTER TABLE "client_packages"
      ADD CONSTRAINT "client_packages_organization_id_organizations_id_fk"
      FOREIGN KEY ("organization_id")
      REFERENCES "public"."organizations"("id")
      ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'client_packages_client_id_clients_id_fk'
  ) THEN
    ALTER TABLE "client_packages"
      ADD CONSTRAINT "client_packages_client_id_clients_id_fk"
      FOREIGN KEY ("client_id")
      REFERENCES "public"."clients"("id")
      ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'client_packages_package_id_packages_id_fk'
  ) THEN
    ALTER TABLE "client_packages"
      ADD CONSTRAINT "client_packages_package_id_packages_id_fk"
      FOREIGN KEY ("package_id")
      REFERENCES "public"."packages"("id")
      ON DELETE restrict ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "supplies" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL,
  "name" text NOT NULL,
  "unit" text NOT NULL DEFAULT 'un',
  "cost_per_unit" integer NOT NULL DEFAULT 0,
  "current_stock" numeric(10,2) NOT NULL DEFAULT '0',
  "min_stock" numeric(10,2) NOT NULL DEFAULT '0',
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'supplies_organization_id_organizations_id_fk'
  ) THEN
    ALTER TABLE "supplies"
      ADD CONSTRAINT "supplies_organization_id_organizations_id_fk"
      FOREIGN KEY ("organization_id")
      REFERENCES "public"."organizations"("id")
      ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "procedure_supplies" (
  "id" text PRIMARY KEY NOT NULL,
  "procedure_id" text NOT NULL,
  "supply_id" text NOT NULL,
  "quantity_per_session" numeric(10,2) NOT NULL DEFAULT '1',
  CONSTRAINT "uniq_proc_supply" UNIQUE("procedure_id", "supply_id")
);
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'procedure_supplies_procedure_id_procedures_id_fk'
  ) THEN
    ALTER TABLE "procedure_supplies"
      ADD CONSTRAINT "procedure_supplies_procedure_id_procedures_id_fk"
      FOREIGN KEY ("procedure_id")
      REFERENCES "public"."procedures"("id")
      ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'procedure_supplies_supply_id_supplies_id_fk'
  ) THEN
    ALTER TABLE "procedure_supplies"
      ADD CONSTRAINT "procedure_supplies_supply_id_supplies_id_fk"
      FOREIGN KEY ("supply_id")
      REFERENCES "public"."supplies"("id")
      ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
