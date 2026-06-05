CREATE TABLE "anamnesis_answers" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"answers" json DEFAULT '{}'::json NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "anamnesis_answers_client_id_unique" UNIQUE("client_id")
);
--> statement-breakpoint
CREATE TABLE "anamnesis_questions" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"label" text NOT NULL,
	"type" text NOT NULL,
	"options" text,
	"placeholder" text,
	"required" boolean DEFAULT false NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "anamnesis_answers" ADD CONSTRAINT "anamnesis_answers_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anamnesis_answers" ADD CONSTRAINT "anamnesis_answers_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anamnesis_questions" ADD CONSTRAINT "anamnesis_questions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;