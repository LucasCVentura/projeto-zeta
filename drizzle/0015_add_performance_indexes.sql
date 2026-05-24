-- Agenda e dashboard: filtro principal por org + profissional + data
CREATE INDEX IF NOT EXISTS "idx_appointments_org_prof_date"
  ON "appointments" ("organization_id", "professional_id", "date");--> statement-breakpoint

-- Histórico do cliente
CREATE INDEX IF NOT EXISTS "idx_appointments_client_org"
  ON "appointments" ("client_id", "organization_id");--> statement-breakpoint

-- Lista de clientes por org
CREATE INDEX IF NOT EXISTS "idx_clients_org"
  ON "clients" ("organization_id");--> statement-breakpoint

-- Receita mensal no dashboard
CREATE INDEX IF NOT EXISTS "idx_transactions_org_prof_date"
  ON "transactions" ("organization_id", "professional_id", "date");--> statement-breakpoint

-- Notificações no header
CREATE INDEX IF NOT EXISTS "idx_notifications_org_user"
  ON "notifications" ("organization_id", "user_id");--> statement-breakpoint

-- Bloqueios de agenda por dia
CREATE INDEX IF NOT EXISTS "idx_schedule_blocks_org_user_date"
  ON "schedule_blocks" ("organization_id", "user_id", "date");--> statement-breakpoint

-- Pacotes do cliente
CREATE INDEX IF NOT EXISTS "idx_client_packages_client_org"
  ON "client_packages" ("client_id", "organization_id");--> statement-breakpoint

-- Fotos do cliente
CREATE INDEX IF NOT EXISTS "idx_client_photos_client"
  ON "client_photos" ("client_id");
