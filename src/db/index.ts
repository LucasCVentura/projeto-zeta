import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

const globalForDb = globalThis as unknown as { pgClient: postgres.Sql | undefined }

const client = globalForDb.pgClient ?? postgres(process.env.DATABASE_URL!, {
  max: 5,
  prepare: false,
  idle_timeout: 20,
  max_lifetime: 1800,
  connection: {
    options: "-c search_path=public",
  },
})

if (process.env.NODE_ENV !== "production") globalForDb.pgClient = client

export const db = drizzle(client, { schema })
