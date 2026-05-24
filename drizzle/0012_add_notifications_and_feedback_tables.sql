CREATE TABLE IF NOT EXISTS "notifications" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL,
  "user_id" text NOT NULL,
  "type" text NOT NULL,
  "title" text NOT NULL,
  "body" text NOT NULL,
  "read" boolean NOT NULL DEFAULT false,
  "href" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'notifications_organization_id_organizations_id_fk'
  ) THEN
    ALTER TABLE "notifications"
      ADD CONSTRAINT "notifications_organization_id_organizations_id_fk"
      FOREIGN KEY ("organization_id")
      REFERENCES "public"."organizations"("id")
      ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'notifications_user_id_users_id_fk'
  ) THEN
    ALTER TABLE "notifications"
      ADD CONSTRAINT "notifications_user_id_users_id_fk"
      FOREIGN KEY ("user_id")
      REFERENCES "public"."users"("id")
      ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "user_feedback" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL,
  "user_id" text NOT NULL,
  "content" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_feedback_organization_id_organizations_id_fk'
  ) THEN
    ALTER TABLE "user_feedback"
      ADD CONSTRAINT "user_feedback_organization_id_organizations_id_fk"
      FOREIGN KEY ("organization_id")
      REFERENCES "public"."organizations"("id")
      ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_feedback_user_id_users_id_fk'
  ) THEN
    ALTER TABLE "user_feedback"
      ADD CONSTRAINT "user_feedback_user_id_users_id_fk"
      FOREIGN KEY ("user_id")
      REFERENCES "public"."users"("id")
      ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "feedback_summaries" (
  "id" text PRIMARY KEY NOT NULL,
  "summary" text NOT NULL,
  "feedback_count" integer NOT NULL,
  "generated_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "inbound_emails" (
  "id" text PRIMARY KEY NOT NULL,
  "from" text NOT NULL,
  "subject" text NOT NULL DEFAULT '(sem assunto)',
  "body" text NOT NULL DEFAULT '',
  "read" boolean NOT NULL DEFAULT false,
  "received_at" timestamp NOT NULL DEFAULT now()
);
