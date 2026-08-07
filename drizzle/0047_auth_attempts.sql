CREATE TABLE "auth_attempts" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"identifier" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "auth_attempts_kind_identifier_idx" ON "auth_attempts" USING btree ("kind","identifier","created_at");
