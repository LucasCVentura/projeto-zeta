import postgres from "postgres"
import { hash } from "bcryptjs"

const dbUrl = process.env.DATABASE_URL
if (!dbUrl) {
  console.error("[e2e] DATABASE_URL não definido.")
  process.exit(1)
}

const host = (() => {
  try {
    return new URL(dbUrl).hostname
  } catch {
    return ""
  }
})()

const isLocalDb = host === "localhost" || host === "127.0.0.1"
if (!isLocalDb && process.env.E2E_ALLOW_REMOTE_DB !== "1") {
  console.error(`[e2e] Banco não local detectado (${host}).`)
  console.error("[e2e] Defina E2E_ALLOW_REMOTE_DB=1 apenas se quiser assumir esse risco.")
  process.exit(1)
}

const email = (process.env.E2E_USER_EMAIL ?? "e2e@kira.local").trim().toLowerCase()
const password = (process.env.E2E_USER_PASSWORD ?? "E2E@123456").trim()
const name = (process.env.E2E_USER_NAME ?? "E2E User").trim()

const sql = postgres(dbUrl, { max: 1, prepare: false })

try {
  const passwordHash = await hash(password, 12)

  await sql.begin(async (tx) => {
    const userRows = await tx`
      insert into users (id, name, email, password, created_at, updated_at)
      values (${crypto.randomUUID()}, ${name}, ${email}, ${passwordHash}, now(), now())
      on conflict (email) do update set
        name = excluded.name,
        password = excluded.password,
        updated_at = now()
      returning id
    `
    const userId = userRows[0].id

    const orgRows = await tx`
      insert into organizations (
        id, name, slug, type, owner_id, subscription_status, created_at, updated_at
      )
      values (
        ${crypto.randomUUID()},
        'Clinica E2E',
        'clinica-e2e',
        'clinic',
        ${userId},
        'trialing',
        now(),
        now()
      )
      on conflict (slug) do update set
        owner_id = excluded.owner_id,
        updated_at = now()
      returning id
    `
    const organizationId = orgRows[0].id

    await tx`
      insert into organization_members (
        id, organization_id, user_id, role, active, invited_at, joined_at
      )
      values (
        ${crypto.randomUUID()},
        ${organizationId},
        ${userId},
        'owner',
        true,
        now(),
        now()
      )
      on conflict (organization_id, user_id) do update set
        role = excluded.role,
        active = true,
        joined_at = coalesce(organization_members.joined_at, now())
    `

    const existingSchedule = await tx`
      select id
      from schedule_config
      where organization_id = ${organizationId}
        and user_id = ${userId}
      limit 1
    `

    if (existingSchedule.length === 0) {
      await tx`
        insert into schedule_config (
          id, organization_id, user_id, work_days, start_time, end_time, slot_duration, created_at, updated_at
        )
        values (
          ${crypto.randomUUID()},
          ${organizationId},
          ${userId},
          '1,2,3,4,5',
          '08:00',
          '18:00',
          60,
          now(),
          now()
        )
      `
    } else {
      await tx`
        update schedule_config
        set work_days = '1,2,3,4,5',
            start_time = '08:00',
            end_time = '18:00',
            slot_duration = 60,
            updated_at = now()
        where id = ${existingSchedule[0].id}
      `
    }
  })

  console.log(`[e2e] Usuário preparado: ${email}`)
} finally {
  await sql.end()
}
