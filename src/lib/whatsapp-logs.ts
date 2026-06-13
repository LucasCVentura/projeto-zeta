import { sql } from "drizzle-orm"
import { db } from "@/db"

export async function logWhatsAppSubmission(params: {
  messageId: string
  organizationId?: string | null
  clientId?: string | null
  destination?: string | null
  templateId: string
  payload?: unknown
}) {
  const { messageId, organizationId, clientId, destination, templateId, payload } = params
  await db.execute(sql`
    INSERT INTO whatsapp_message_logs (
      id, message_id, organization_id, client_id, destination, template_id, event_type, payload, created_at, updated_at
    )
    VALUES (
      ${crypto.randomUUID()},
      ${messageId},
      ${organizationId ?? null},
      ${clientId ?? null},
      ${destination ?? null},
      ${templateId},
      'submitted',
      ${payload ? JSON.stringify(payload) : null},
      now(),
      now()
    )
    ON CONFLICT (message_id) DO UPDATE SET
      organization_id = COALESCE(EXCLUDED.organization_id, whatsapp_message_logs.organization_id),
      client_id = COALESCE(EXCLUDED.client_id, whatsapp_message_logs.client_id),
      destination = COALESCE(EXCLUDED.destination, whatsapp_message_logs.destination),
      template_id = COALESCE(EXCLUDED.template_id, whatsapp_message_logs.template_id),
      event_type = 'submitted',
      payload = COALESCE(EXCLUDED.payload, whatsapp_message_logs.payload),
      updated_at = now()
  `)
}

export async function logWhatsAppEvent(params: {
  messageId: string
  eventType: string
  payload?: unknown
  error?: string | null
  destination?: string | null
}) {
  const { messageId, eventType, payload, error, destination } = params
  await db.execute(sql`
    INSERT INTO whatsapp_message_logs (
      id, message_id, destination, event_type, error, payload, created_at, updated_at
    )
    VALUES (
      ${crypto.randomUUID()},
      ${messageId},
      ${destination ?? null},
      ${eventType},
      ${error ?? null},
      ${payload ? JSON.stringify(payload) : null},
      now(),
      now()
    )
    ON CONFLICT (message_id) DO UPDATE SET
      destination = COALESCE(EXCLUDED.destination, whatsapp_message_logs.destination),
      event_type = EXCLUDED.event_type,
      error = COALESCE(EXCLUDED.error, whatsapp_message_logs.error),
      payload = COALESCE(EXCLUDED.payload, whatsapp_message_logs.payload),
      updated_at = now()
  `)

  // Gupshup usa IDs diferentes para eventos de status (delivered/read) vs submission.
  // Quando o conflict não acontece, a linha fica sem organization_id.
  // Backfill: busca a org mais recente que enviou para esse destino nos últimos 7 dias.
  if (destination) {
    await db.execute(sql`
      UPDATE whatsapp_message_logs
      SET organization_id = (
        SELECT l2.organization_id
        FROM whatsapp_message_logs l2
        WHERE l2.destination = ${destination}
          AND l2.organization_id IS NOT NULL
          AND l2.created_at >= now() - interval '7 days'
        ORDER BY l2.created_at DESC
        LIMIT 1
      )
      WHERE message_id = ${messageId}
        AND organization_id IS NULL
    `)
  }
}
