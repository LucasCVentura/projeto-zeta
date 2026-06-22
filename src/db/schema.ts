import {
  pgTable,
  text,
  timestamp,
  pgEnum,
  date,
  boolean,
  unique,
  uniqueIndex,
  integer,
  time,
  numeric,
  json,
  jsonb,
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

// ── enums ────────────────────────────────────────────────────────────────────

export const professionEnum = pgEnum("profession", ["esteticista", "biomedico", "outro"])

export const orgRoleEnum = pgEnum("org_role", [
  "owner",
  "professional",
  "receptionist",
  "financial",
])

export const orgTypeEnum = pgEnum("org_type", ["individual", "clinic"])

export const appointmentStatusEnum = pgEnum("appointment_status", [
  "waiting",
  "confirmed",
  "completed",
  "missed",
  "cancelled",
])

// ── users ────────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password"),
  image: text("image"),

  cpf: text("cpf").unique(),
  phone: text("phone"),
  whatsapp: text("whatsapp"),
  birthDate: date("birth_date"),

  profession: professionEnum("profession"),
  professionSegment: text("profession_segment"),
  professionalDocument: text("professional_document"),
  professionalDocumentType: text("professional_document_type"),
  instagram: text("instagram"),

  lastSeenChangelog: text("last_seen_changelog"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// ── organizations ────────────────────────────────────────────────────────────

export const organizations = pgTable("organizations", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  type: orgTypeEnum("type").notNull().default("individual"),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),

  phone: text("phone"),
  email: text("email"),
  instagram: text("instagram"),
  address: text("address"),
  googleReviewUrl: text("google_review_url"),
  imageConsentText: text("image_consent_text"),
  logo: text("logo"),

  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionStatus: text("subscription_status").default("trialing").notNull(),
  trialEndsAt: timestamp("trial_ends_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// ── organization_members ─────────────────────────────────────────────────────

export const organizationMembers = pgTable(
  "organization_members",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: orgRoleEnum("role").notNull().default("professional"),
    active: boolean("active").notNull().default(true),

    invitedAt: timestamp("invited_at").defaultNow().notNull(),
    joinedAt: timestamp("joined_at"),
  },
  (t) => [unique("uniq_org_user").on(t.organizationId, t.userId)]
)

// ── invites ──────────────────────────────────────────────────────────────────

export const invites = pgTable("invites", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: orgRoleEnum("role").notNull().default("professional"),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  acceptedAt: timestamp("accepted_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// ── clients ──────────────────────────────────────────────────────────────────

export const clients = pgTable("clients", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),

  name: text("name").notNull(),
  phone: text("phone"),
  whatsapp: text("whatsapp"),
  email: text("email"),
  cpf: text("cpf"),
  birthDate: date("birth_date"),
  notes: text("notes"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// ── schedule_config ───────────────────────────────────────────────────────────
// Configuração de horários de trabalho por profissional

export const scheduleConfig = pgTable("schedule_config", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  // dias da semana ativos: array de 0 (dom) a 6 (sáb)
  workDays: text("work_days").notNull().default("1,2,3,4,5"), // seg-sex
  startTime: time("start_time").notNull().default("08:00"),
  endTime: time("end_time").notNull().default("18:00"),
  slotDuration: integer("slot_duration").notNull().default(60), // minutos
  breakStart: time("break_start"),  // início do intervalo (ex: 12:00)
  breakEnd: time("break_end"),      // fim do intervalo (ex: 13:00)

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// ── schedule_blocks ───────────────────────────────────────────────────────────
// Bloqueios pontuais na agenda (folga, reunião, etc.)

export const scheduleBlocks = pgTable("schedule_blocks", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  date: date("date").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  reason: text("reason"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// ── appointments ──────────────────────────────────────────────────────────────

export const appointments = pgTable("appointments", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  professionalId: text("professional_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  clientId: text("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "restrict" }),

  date: date("date").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),

  procedureId: text("procedure_id").references(() => procedures.id, { onDelete: "set null" }),
  procedure: text("procedure"),       // nome snapshot no momento do agendamento
  clientPackageId: text("client_package_id"),   // ref a client_packages, sem FK para evitar circularidade
  notes: text("notes"),
  status: appointmentStatusEnum("status").notNull().default("waiting"),

  createdById: text("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),

  reminderSentAt: timestamp("reminder_sent_at"),
})

// ── procedures ────────────────────────────────────────────────────────────────

export const procedures = pgTable("procedures", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),

  name: text("name").notNull(),
  price: integer("price").notNull().default(0), // centavos
  commissionPct: integer("commission_pct").notNull().default(0), // 0–100
  hasReturn: boolean("has_return").notNull().default(false),
  returnIntervalDays: integer("return_interval_days"),
  active: boolean("active").notNull().default(true),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// ── client_photos ─────────────────────────────────────────────────────────────

export const clientPhotos = pgTable("client_photos", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  clientId: text("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),

  url: text("url").notNull(),
  procedureId: text("procedure_id").references(() => procedures.id, { onDelete: "set null" }),
  procedure: text("procedure"), // snapshot do nome
  notes: text("notes"),
  takenAt: date("taken_at").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// ── transactions ─────────────────────────────────────────────────────────────

export const paymentMethodEnum = pgEnum("payment_method", [
  "pix",
  "cartao_credito",
  "cartao_debito",
  "dinheiro",
  "parcelado",
])

export const transactions = pgTable("transactions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  professionalId: text("professional_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),

  appointmentId: text("appointment_id").references(() => appointments.id, { onDelete: "set null" }),
  clientPackageId: text("client_package_id"), // sem FK para evitar circularidade; preenchido na venda de pacote

  amount: integer("amount").notNull(), // centavos (receita bruta; 0 para sessões de pacote)
  commissionAmount: integer("commission_amount"), // centavos; null = sem comissão configurada
  description: text("description"),
  date: date("date").notNull(),
  paymentMethod: paymentMethodEnum("payment_method"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// ── packages ──────────────────────────────────────────────────────────────────

export const packages = pgTable("packages", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  procedureId: text("procedure_id")
    .notNull()
    .references(() => procedures.id, { onDelete: "restrict" }),

  name: text("name").notNull(),
  description: text("description"),
  totalSessions: integer("total_sessions").notNull().default(4),
  price: integer("price").notNull().default(0), // centavos
  cost: integer("cost").notNull().default(0),   // custo de insumos, centavos
  active: boolean("active").notNull().default(true),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// ── client_packages ───────────────────────────────────────────────────────────

export const clientPackages = pgTable("client_packages", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  clientId: text("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  packageId: text("package_id")
    .notNull()
    .references(() => packages.id, { onDelete: "restrict" }),

  sessionsUsed: integer("sessions_used").notNull().default(0),
  purchasedAt: date("purchased_at").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// ── supplies ──────────────────────────────────────────────────────────────────

export const supplies = pgTable("supplies", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),

  name: text("name").notNull(),
  unit: text("unit").notNull().default("un"), // ml, g, un, etc.
  costPerUnit: integer("cost_per_unit").notNull().default(0), // centavos
  currentStock: numeric("current_stock", { precision: 10, scale: 2 }).notNull().default("0"),
  minStock: numeric("min_stock", { precision: 10, scale: 2 }).notNull().default("0"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// ── procedure_supplies ────────────────────────────────────────────────────────

export const procedureSupplies = pgTable("procedure_supplies", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  procedureId: text("procedure_id")
    .notNull()
    .references(() => procedures.id, { onDelete: "cascade" }),
  supplyId: text("supply_id")
    .notNull()
    .references(() => supplies.id, { onDelete: "cascade" }),

  quantityPerSession: numeric("quantity_per_session", { precision: 10, scale: 2 }).notNull().default("1"),
},
  (t) => [unique("uniq_proc_supply").on(t.procedureId, t.supplyId)]
)

// ── password_reset_tokens ─────────────────────────────────────────────────────

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// ── client_anamnesis ──────────────────────────────────────────────────────────

export const clientAnamnesis = pgTable("client_anamnesis", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  clientId: text("client_id")
    .notNull()
    .unique()
    .references(() => clients.id, { onDelete: "cascade" }),

  // Saúde geral
  hasAllergies: boolean("has_allergies").default(false),
  allergiesDetail: text("allergies_detail"),

  hasContraindications: boolean("has_contraindications").default(false),
  contraindicationsDetail: text("contraindications_detail"),

  usesMedication: boolean("uses_medication").default(false),
  medicationDetail: text("medication_detail"),

  hasChronicCondition: boolean("has_chronic_condition").default(false),
  chronicConditionDetail: text("chronic_condition_detail"),

  isPregnant: boolean("is_pregnant").default(false),

  // Pele / estética
  skinType: text("skin_type"),           // oleosa, seca, mista, normal, sensível
  skinSensitivity: text("skin_sensitivity"),
  previousProcedures: text("previous_procedures"),
  skinComplaints: text("skin_complaints"),

  // Objetivo estético
  aestheticGoal: text("aesthetic_goal"),

  // Observações livres
  extraNotes: text("extra_notes"),

  // Autorização de uso de imagem: null = não respondeu, true = autorizou, false = não autorizou
  imageConsent: boolean("image_consent"),
  imageConsentAt: timestamp("image_consent_at"),

  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// ── anamnesis_questions ───────────────────────────────────────────────────────

export const anamnesisQuestions = pgTable("anamnesis_questions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),

  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),

  label: text("label").notNull(),
  type: text("type").notNull(), // "text" | "boolean" | "select" | "multiselect"
  options: text("options"),     // JSON array de strings, apenas para select/multiselect
  placeholder: text("placeholder"),
  required: boolean("required").default(false).notNull(),
  order: integer("order").default(0).notNull(),
  isDefault: boolean("is_default").default(false).notNull(), // veio do seed padrão

  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export type AnamnesisQuestion = typeof anamnesisQuestions.$inferSelect

// ── consent_terms ─────────────────────────────────────────────────────────────

export const consentTerms = pgTable("consent_terms", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  orgId: text("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  body: text("body").notNull(),
  active: boolean("active").notNull().default(true),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const consentTermRecords = pgTable("consent_term_records", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  clientId: text("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  orgId: text("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  termId: text("term_id").notNull().references(() => consentTerms.id, { onDelete: "cascade" }),
  accepted: boolean("accepted").notNull(),
  respondedAt: timestamp("responded_at").notNull().defaultNow(),
})

export type ConsentTerm = typeof consentTerms.$inferSelect
export type ConsentTermRecord = typeof consentTermRecords.$inferSelect

// ── anamnesis_answers ─────────────────────────────────────────────────────────

export const anamnesisAnswers = pgTable("anamnesis_answers", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),

  clientId: text("client_id")
    .notNull()
    .unique()
    .references(() => clients.id, { onDelete: "cascade" }),

  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),

  // { [questionId]: string | boolean | string[] }
  answers: json("answers").notNull().default({}),

  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export type AnamnesisAnswer = typeof anamnesisAnswers.$inferSelect

// ── relations ────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(organizationMembers),
  ownedOrganizations: many(organizations),
  scheduleConfig: many(scheduleConfig),
  scheduleBlocks: many(scheduleBlocks),
  appointments: many(appointments),
}))

export const organizationsRelations = relations(organizations, ({ one, many }) => ({
  owner: one(users, { fields: [organizations.ownerId], references: [users.id] }),
  members: many(organizationMembers),
  invites: many(invites),
  clients: many(clients),
  scheduleConfigs: many(scheduleConfig),
  scheduleBlocks: many(scheduleBlocks),
  appointments: many(appointments),
}))

export const organizationMembersRelations = relations(organizationMembers, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationMembers.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [organizationMembers.userId],
    references: [users.id],
  }),
}))

export const invitesRelations = relations(invites, ({ one }) => ({
  organization: one(organizations, {
    fields: [invites.organizationId],
    references: [organizations.id],
  }),
}))

export const clientsRelations = relations(clients, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [clients.organizationId],
    references: [organizations.id],
  }),
  appointments: many(appointments),
  anamnesis: one(clientAnamnesis, {
    fields: [clients.id],
    references: [clientAnamnesis.clientId],
  }),
}))

export const clientAnamnesisRelations = relations(clientAnamnesis, ({ one }) => ({
  client: one(clients, {
    fields: [clientAnamnesis.clientId],
    references: [clients.id],
  }),
}))

export const proceduresRelations = relations(procedures, ({ one }) => ({
  organization: one(organizations, {
    fields: [procedures.organizationId],
    references: [organizations.id],
  }),
}))

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  organization: one(organizations, {
    fields: [appointments.organizationId],
    references: [organizations.id],
  }),
  professional: one(users, {
    fields: [appointments.professionalId],
    references: [users.id],
  }),
  client: one(clients, {
    fields: [appointments.clientId],
    references: [clients.id],
  }),
}))

// ── types ────────────────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Organization = typeof organizations.$inferSelect
export type NewOrganization = typeof organizations.$inferInsert
export type OrganizationMember = typeof organizationMembers.$inferSelect
export type OrgRole = (typeof orgRoleEnum.enumValues)[number]
export type Client = typeof clients.$inferSelect
export type NewClient = typeof clients.$inferInsert
export type Appointment = typeof appointments.$inferSelect
export type NewAppointment = typeof appointments.$inferInsert
export type AppointmentStatus = (typeof appointmentStatusEnum.enumValues)[number]
export type ScheduleConfig = typeof scheduleConfig.$inferSelect
export type ScheduleBlock = typeof scheduleBlocks.$inferSelect
export type ClientAnamnesis = typeof clientAnamnesis.$inferSelect
export type NewClientAnamnesis = typeof clientAnamnesis.$inferInsert
export type Procedure = typeof procedures.$inferSelect
export type NewProcedure = typeof procedures.$inferInsert
export type Transaction = typeof transactions.$inferSelect
export type PaymentMethod = (typeof paymentMethodEnum.enumValues)[number]
export type NewTransaction = typeof transactions.$inferInsert
export type ClientPhoto = typeof clientPhotos.$inferSelect
export type Package = typeof packages.$inferSelect
export type NewPackage = typeof packages.$inferInsert
export type ClientPackage = typeof clientPackages.$inferSelect
export type NewClientPackage = typeof clientPackages.$inferInsert
export type Supply = typeof supplies.$inferSelect
export type NewSupply = typeof supplies.$inferInsert
export type ProcedureSupply = typeof procedureSupplies.$inferSelect
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect

// ── notifications ─────────────────────────────────────────────────────────────

export const notifications = pgTable("notifications", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),

  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  type: text("type").notNull(), // "appointment_cancelled" | "low_stock" | etc
  title: text("title").notNull(),
  body: text("body").notNull(),
  read: boolean("read").notNull().default(false),
  href: text("href"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export type Notification = typeof notifications.$inferSelect

// ── user_feedback ──────────────────────────────────────────────────────────────

export const userFeedback = pgTable("user_feedback", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),

  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export type UserFeedback = typeof userFeedback.$inferSelect

// ── feedback_summaries ─────────────────────────────────────────────────────────

export const feedbackSummaries = pgTable("feedback_summaries", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  summary: text("summary").notNull(),
  feedbackCount: integer("feedback_count").notNull(),
  generatedAt: timestamp("generated_at").notNull().defaultNow(),
})

export type FeedbackSummary = typeof feedbackSummaries.$inferSelect

// ── inbound_emails ─────────────────────────────────────────────────────────────

export const inboundEmails = pgTable("inbound_emails", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  from: text("from").notNull(),
  subject: text("subject").notNull().default("(sem assunto)"),
  body: text("body").notNull().default(""),
  read: boolean("read").notNull().default(false),
  receivedAt: timestamp("received_at").notNull().defaultNow(),
})

export type InboundEmail = typeof inboundEmails.$inferSelect

// ── push_subscriptions ────────────────────────────────────────────────────────

// ── client_documents ─────────────────────────────────────────────────────────

export const clientDocuments = pgTable("client_documents", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  clientId: text("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),

  name: text("name").notNull(),
  url: text("url").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: text("file_size").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export type ClientDocument = typeof clientDocuments.$inferSelect

// ── push_subscriptions ────────────────────────────────────────────────────────

// ── whatsapp_pending_confirmations ────────────────────────────────────────────

export const whatsappPendingConfirmations = pgTable("whatsapp_pending_confirmations", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  messageId: text("message_id").notNull().unique(),
  appointmentId: text("appointment_id").references(() => appointments.id, { onDelete: "cascade" }),
  clientPackageId: text("client_package_id").references(() => clientPackages.id, { onDelete: "cascade" }),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
})

// ── whatsapp_template_settings ───────────────────────────────────────────────

export const whatsappTemplateSettings = pgTable("whatsapp_template_settings", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" })
    .unique(),

  bookingSummaryTemplateId: text("booking_summary_template_id"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export type WhatsAppTemplateSetting = typeof whatsappTemplateSettings.$inferSelect

// ── whatsapp_system_template_settings ────────────────────────────────────────

export const whatsappSystemTemplateSettings = pgTable("whatsapp_system_template_settings", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  singletonKey: text("singleton_key").notNull().unique(),
  bookingSummaryTemplateId: text("booking_summary_template_id"),
  packageSummaryTemplateId: text("package_summary_template_id"),
  reminderConfirmationTemplateId: text("reminder_confirmation_template_id"),
  postVisitTemplateId: text("post_visit_template_id"),
  trialOutreachTemplateId: text("trial_outreach_template_id"),
  testimonialOutreachTemplateId: text("testimonial_outreach_template_id"),
  winbackOutreachTemplateId: text("winback_outreach_template_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export type WhatsAppSystemTemplateSetting = typeof whatsappSystemTemplateSettings.$inferSelect

// ── trial_reactivation_tokens ─────────────────────────────────────────────────

export const trialReactivationTokens = pgTable("trial_reactivation_tokens", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  token: text("token").notNull().unique(),
  organizationId: text("organization_id").notNull(),
  usedAt: timestamp("used_at"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export type TrialReactivationToken = typeof trialReactivationTokens.$inferSelect

// ── push_subscriptions ────────────────────────────────────────────────────────

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

// ── admin_chat_messages ───────────────────────────────────────────────────────
// Chat de suporte entre admin e usuários do Kira via WhatsApp

export const adminChatMessages = pgTable("admin_chat_messages", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  phone: text("phone").notNull(),          // número normalizado (55XXXXXXXXXXX)
  senderName: text("sender_name"),         // nome identificado (se cruzado com org)
  direction: text("direction").notNull(),  // "inbound" | "outbound"
  content: text("content").notNull(),
  gupshupMessageId: text("gupshup_message_id"),
  templateUsed: text("template_used"),     // nome do template, se outbound via template
  queue: text("queue"),                    // 'support' | 'commercial' | null
  readAt: timestamp("read_at"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export type AdminChatMessage = typeof adminChatMessages.$inferSelect

// ── chat_sessions ─────────────────────────────────────────────────────────────
// Rastreia o estado do bot por número de telefone

export const chatSessions = pgTable("chat_sessions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  phone: text("phone").notNull().unique(),
  // 'awaiting_selection' | 'awaiting_cpf' | 'routed'
  state: text("state").notNull().default("awaiting_selection"),
  // 'support' | 'commercial' | null
  queue: text("queue"),
  userName: text("user_name"),
  orgName: text("org_name"),

  archived: boolean("archived").notNull().default(false),

  lastActivityAt: timestamp("last_activity_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export type ChatSession = typeof chatSessions.$inferSelect

// ── ai_photo_analyses ─────────────────────────────────────────────────────────

export const aiPhotoAnalyses = pgTable("ai_photo_analyses", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  photoKey: text("photo_key").notNull(),
  analysisType: text("analysis_type").notNull(),
  analysis: text("analysis").notNull(),
  imageUrl: text("image_url"),
  areas: jsonb("areas"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  uniqueIndex("ai_photo_analyses_key_idx").on(t.organizationId, t.photoKey, t.analysisType),
])
