ALTER TABLE "chat_sessions"
  ADD COLUMN IF NOT EXISTS "archived" boolean DEFAULT false NOT NULL;
