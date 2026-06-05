CREATE TABLE "admin_chat_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"phone" text NOT NULL,
	"sender_name" text,
	"direction" text NOT NULL,
	"content" text NOT NULL,
	"gupshup_message_id" text,
	"template_used" text,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "whatsapp_system_template_settings" ADD COLUMN "trial_outreach_template_id" text;