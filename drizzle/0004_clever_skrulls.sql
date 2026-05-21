CREATE TABLE "client_anamnesis" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"has_allergies" boolean DEFAULT false,
	"allergies_detail" text,
	"has_contraindications" boolean DEFAULT false,
	"contraindications_detail" text,
	"uses_medication" boolean DEFAULT false,
	"medication_detail" text,
	"has_chronic_condition" boolean DEFAULT false,
	"chronic_condition_detail" text,
	"is_pregnant" boolean DEFAULT false,
	"skin_type" text,
	"skin_sensitivity" text,
	"previous_procedures" text,
	"skin_complaints" text,
	"extra_notes" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "client_anamnesis_client_id_unique" UNIQUE("client_id")
);
--> statement-breakpoint
ALTER TABLE "client_anamnesis" ADD CONSTRAINT "client_anamnesis_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;