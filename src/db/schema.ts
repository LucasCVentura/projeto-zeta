import {
  pgTable,
  text,
  timestamp,
  pgEnum,
  date,
  boolean,
  unique,
  integer,
  time,
  numeric,
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

// ── enums ────────────────────────────────────────────────────────────────────

export const professionEnum = pgEnum("profession", ["esteticista", "biomedico"])

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
  professionalDocument: text("professional_document"),
  professionalDocumentType: text("professional_document_type"),
  instagram: text("instagram"),

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
  logo: text("logo"),

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

  amount: integer("amount").notNull(), // centavos
  description: text("description"),
  date: date("date").notNull(),

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

  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

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
export type NewTransaction = typeof transactions.$inferInsert
export type ClientPhoto = typeof clientPhotos.$inferSelect
export type Package = typeof packages.$inferSelect
export type NewPackage = typeof packages.$inferInsert
export type ClientPackage = typeof clientPackages.$inferSelect
export type NewClientPackage = typeof clientPackages.$inferInsert
export type Supply = typeof supplies.$inferSelect
export type NewSupply = typeof supplies.$inferInsert
export type ProcedureSupply = typeof procedureSupplies.$inferSelect
