CREATE TYPE "public"."payment_method" AS ENUM('pix', 'cartao_credito', 'cartao_debito', 'dinheiro', 'parcelado');--> statement-breakpoint
CREATE TABLE "client_documents" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"client_id" text NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"file_type" text NOT NULL,
	"file_size" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "push_subscriptions_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
CREATE TABLE "whatsapp_pending_confirmations" (
	"id" text PRIMARY KEY NOT NULL,
	"message_id" text NOT NULL,
	"appointment_id" text,
	"client_package_id" text,
	"organization_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	CONSTRAINT "whatsapp_pending_confirmations_message_id_unique" UNIQUE("message_id")
);
--> statement-breakpoint
CREATE TABLE "whatsapp_system_template_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"singleton_key" text NOT NULL,
	"booking_summary_template_id" text,
	"package_summary_template_id" text,
	"reminder_confirmation_template_id" text,
	"post_visit_template_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "whatsapp_system_template_settings_singleton_key_unique" UNIQUE("singleton_key")
);
--> statement-breakpoint
CREATE TABLE "whatsapp_template_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"booking_summary_template_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "whatsapp_template_settings_organization_id_unique" UNIQUE("organization_id")
);
--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "reminder_sent_at" timestamp;--> statement-breakpoint
ALTER TABLE "procedures" ADD COLUMN "has_return" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "procedures" ADD COLUMN "return_interval_days" integer;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "payment_method" "payment_method";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_seen_changelog" text;--> statement-breakpoint
ALTER TABLE "client_documents" ADD CONSTRAINT "client_documents_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_documents" ADD CONSTRAINT "client_documents_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_pending_confirmations" ADD CONSTRAINT "whatsapp_pending_confirmations_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_pending_confirmations" ADD CONSTRAINT "whatsapp_pending_confirmations_client_package_id_client_packages_id_fk" FOREIGN KEY ("client_package_id") REFERENCES "public"."client_packages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_pending_confirmations" ADD CONSTRAINT "whatsapp_pending_confirmations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_template_settings" ADD CONSTRAINT "whatsapp_template_settings_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;