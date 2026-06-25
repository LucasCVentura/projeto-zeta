CREATE TABLE "appointment_procedures" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"appointment_id" text NOT NULL,
	"procedure_id" text,
	"name" text NOT NULL,
	"price" integer DEFAULT 0 NOT NULL,
	"commission_pct" integer DEFAULT 0 NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "appointment_procedures" ADD CONSTRAINT "appointment_procedures_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_procedures" ADD CONSTRAINT "appointment_procedures_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_procedures" ADD CONSTRAINT "appointment_procedures_procedure_id_procedures_id_fk" FOREIGN KEY ("procedure_id") REFERENCES "public"."procedures"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
-- Backfill: cada agendamento existente com procedimento vira 1 linha na junction.
-- Idempotente: ignora agendamentos que já tenham linha na junction.
INSERT INTO "appointment_procedures" ("id", "organization_id", "appointment_id", "procedure_id", "name", "price", "commission_pct", "position", "created_at")
SELECT gen_random_uuid()::text, a."organization_id", a."id", a."procedure_id",
       COALESCE(NULLIF(a."procedure", ''), p."name", 'Procedimento'),
       COALESCE(p."price", 0), COALESCE(p."commission_pct", 0), 0, now()
FROM "appointments" a
LEFT JOIN "procedures" p ON p."id" = a."procedure_id"
WHERE (a."procedure" IS NOT NULL OR a."procedure_id" IS NOT NULL)
  AND NOT EXISTS (
    SELECT 1 FROM "appointment_procedures" ap WHERE ap."appointment_id" = a."id"
  );
