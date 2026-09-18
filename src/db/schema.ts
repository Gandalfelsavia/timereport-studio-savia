import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  numeric,
  date,
  time,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const roleEnum = pgEnum("role", ["EMPLOYEE", "ADMIN", "SUPERVISOR"]);
export const billingTypeEnum = pgEnum("billing_type", [
  "HOURLY",
  "FORFAIT",
  "MIXED",
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: roleEnum("role").notNull().default("EMPLOYEE"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const activityCategories = pgTable("activity_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  active: boolean("active").notNull().default(true),
  sortOrder: numeric("sort_order", { precision: 5, scale: 0, mode: "number" }).notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  billingType: billingTypeEnum("billing_type").notNull().default("HOURLY"),
  // Tariffa oraria applicata alle attività "da fatturare" per questo cliente
  hourlyRate: numeric("hourly_rate", { precision: 8, scale: 2, mode: "number" }),
  // Importo forfettario periodico (informativo, es. mensile/annuo)
  forfaitAmount: numeric("forfait_amount", { precision: 10, scale: 2, mode: "number" }),
  forfaitNote: varchar("forfait_note", { length: 255 }),
  active: boolean("active").notNull().default(true),
  notes: text("notes"),
  // Anagrafica estesa (tutti campi facoltativi): dati fiscali e di contatto,
  // utili in futuro per generare preventivi e lettere d'incarico.
  address: text("address"),
  vatNumber: varchar("vat_number", { length: 20 }),
  taxCode: varchar("tax_code", { length: 20 }),
  sdiCode: varchar("sdi_code", { length: 10 }),
  pec: varchar("pec", { length: 255 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  // Legale rappresentante: non tutte le forme cliente ne hanno uno (es. ditte
  // individuali). Il flag è impostato manualmente da chi compila la scheda.
  hasLegalRepresentative: boolean("has_legal_representative").notNull().default(false),
  legalRepFirstName: varchar("legal_rep_first_name", { length: 100 }),
  legalRepLastName: varchar("legal_rep_last_name", { length: 100 }),
  legalRepBirthDate: date("legal_rep_birth_date", { mode: "string" }),
  legalRepBirthPlace: varchar("legal_rep_birth_place", { length: 255 }),
  legalRepResidence: text("legal_rep_residence"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const timeEntries = pgTable("time_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "restrict" }),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => activityCategories.id, { onDelete: "restrict" }),
  date: date("date", { mode: "string" }).notNull(),
  description: text("description").notNull(),
  // Orario dell'attività (dalle-alle): usato per calcolare automaticamente "hours".
  // Nullable per compatibilità con le attività storiche inserite solo in ore.
  startTime: time("start_time", { precision: 0 }),
  endTime: time("end_time", { precision: 0 }),
  hours: numeric("hours", { precision: 5, scale: 2, mode: "number" }).notNull(),
  // true = attività da fatturare extra al cliente; false = inclusa nel forfait/non fatturabile
  billable: boolean("billable").notNull().default(true),
  // Importo fisso da fatturare per questa attività: se impostato, SOSTITUISCE il calcolo
  // automatico ore × tariffa oraria del cliente. Rilevante solo se billable = true.
  billingAmount: numeric("billing_amount", { precision: 10, scale: 2, mode: "number" }),
  // Costo sostenuto (bolli, diritti CCIAA, ecc.) da riaddebitare al cliente insieme
  // all'attività. Riaddebitato solo se billable = true.
  expenseAmount: numeric("expense_amount", { precision: 10, scale: 2, mode: "number" }),
  expenseNote: varchar("expense_note", { length: 255 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  timeEntries: many(timeEntries),
}));

export const clientsRelations = relations(clients, ({ many }) => ({
  timeEntries: many(timeEntries),
}));

export const activityCategoriesRelations = relations(activityCategories, ({ many }) => ({
  timeEntries: many(timeEntries),
}));

export const timeEntriesRelations = relations(timeEntries, ({ one }) => ({
  user: one(users, {
    fields: [timeEntries.userId],
    references: [users.id],
  }),
  client: one(clients, {
    fields: [timeEntries.clientId],
    references: [clients.id],
  }),
  category: one(activityCategories, {
    fields: [timeEntries.categoryId],
    references: [activityCategories.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;
export type TimeEntry = typeof timeEntries.$inferSelect;
export type NewTimeEntry = typeof timeEntries.$inferInsert;
export type ActivityCategory = typeof activityCategories.$inferSelect;
export type NewActivityCategory = typeof activityCategories.$inferInsert;
