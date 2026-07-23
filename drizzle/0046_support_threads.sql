-- Sistema de chamados: thread única e contínua de suporte por organização,
-- substituindo o papel de suporte hoje feito via WhatsApp (Chat) e e-mail (Suporte).
-- Ver src/lib/feature-flags.ts (chave "support-tickets") para rollout gradual.

CREATE TABLE IF NOT EXISTS support_threads (
  id text PRIMARY KEY,
  organization_id text NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'open', -- 'open' | 'resolved'
  last_message_at timestamp NOT NULL DEFAULT now(),
  last_message_preview text,
  unread_by_admin boolean NOT NULL DEFAULT false,
  unread_by_org boolean NOT NULL DEFAULT false,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS support_messages (
  id text PRIMARY KEY,
  thread_id text NOT NULL REFERENCES support_threads(id) ON DELETE CASCADE,
  sender_type text NOT NULL, -- 'admin' | 'org'
  sender_user_id text REFERENCES users(id) ON DELETE SET NULL,
  content text,
  image_url text,
  read_at timestamp,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS support_messages_thread_id_idx ON support_messages (thread_id, created_at);
