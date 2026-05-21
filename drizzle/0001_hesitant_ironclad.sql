ALTER TABLE "users" ADD COLUMN "cpf" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "whatsapp" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "birth_date" date;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "professional_document" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "professional_document_type" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "clinic_name" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "instagram" text;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_cpf_unique" UNIQUE("cpf");