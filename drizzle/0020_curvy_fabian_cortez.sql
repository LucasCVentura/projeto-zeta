CREATE TABLE "chat_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"phone" text NOT NULL,
	"state" text DEFAULT 'awaiting_selection' NOT NULL,
	"queue" text,
	"user_name" text,
	"org_name" text,
	"last_activity_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "chat_sessions_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
ALTER TABLE "admin_chat_messages" ADD COLUMN "queue" text;