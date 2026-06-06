import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

const globalForDb = globalThis as unknown as { pgClient: postgres.Sql | undefined }

const client = globalForDb.pgClient ?? postgres(process.env.DATABASE_URL!, {
  max: 1,           // serverless: 1 conexão por invocação evita esgotar o pool do Supabase
  prepare: false,
  connect_timeout: 10,
  idle_timeout: 20, // fecha conexões ociosas após 20s — evita zombies no Supabase
  max_lifetime: 1800, // fecha e reabre conexões após 30 min para evitar staleness
  connection: {
    options: "-c search_path=public",
  },
})

if (process.env.NODE_ENV !== "production") globalForDb.pgClient = client

export const db = drizzle(client, { schema })
