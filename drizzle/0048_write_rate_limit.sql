-- Server actions não têm rate limit nenhum hoje (não passam por PostgREST,
-- então o padrão do Supabase não se aplica) — uma conta comprometida ou um
-- bug em loop no cliente consegue inflar o banco sem freio. O freio fica no
-- próprio Postgres, único lugar garantido de passar por toda escrita
-- independente da camada de cima.
CREATE OR REPLACE FUNCTION enforce_org_insert_rate_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  limite int := TG_ARGV[0]::int;
  qtd int;
BEGIN
  EXECUTE format(
    'SELECT count(*) FROM %I WHERE organization_id = $1 AND created_at > now() - interval ''1 minute''',
    TG_TABLE_NAME
  ) INTO qtd USING NEW.organization_id;

  IF qtd >= limite THEN
    RAISE EXCEPTION 'Muitos registros criados em pouco tempo. Aguarde um instante.'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END $$;

CREATE INDEX IF NOT EXISTS clients_org_created_idx ON clients (organization_id, created_at);
CREATE TRIGGER clients_insert_rate_limit
  BEFORE INSERT ON clients
  FOR EACH ROW EXECUTE FUNCTION enforce_org_insert_rate_limit('300');

CREATE INDEX IF NOT EXISTS appointments_org_created_idx ON appointments (organization_id, created_at);
CREATE TRIGGER appointments_insert_rate_limit
  BEFORE INSERT ON appointments
  FOR EACH ROW EXECUTE FUNCTION enforce_org_insert_rate_limit('300');
