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

// --- Preventivi (gestionale di studio) ---

// Le tre realtà che possono emettere un preventivo. Studio Savia è previsto
// nell'enum per estendere in futuro senza migrazioni aggiuntive, ma al momento
// non viene seminato/utilizzato (si parte solo con ABSV e RSVV).
export const quoteEntityKeyEnum = pgEnum("quote_entity_key", [
  "ABSV",
  "RSVV",
  "STUDIO_SAVIA",
]);

// Le 5 "famiglie" di preventivo individuate con lo studio: ciascuna propone
// un set di righe di partenza diverso e una modalità di prezzo diversa.
export const quoteFamilyEnum = pgEnum("quote_family", [
  "SOCIETA",
  "RAPPRESENTANZA_FISCALE",
  "ETS_ASD",
  "DITTA_INDIVIDUALE",
  "FORFETTARIO",
]);

// Modalità di determinazione del prezzo del preventivo:
// - ITEMIZED: ogni riga ha un importo e una periodicità, il riepilogo è la
//   somma automatica (Società, Rappresentanza fiscale, Ditta individuale).
// - FLAT: le righe sono solo descrittive (elenco prestazioni incluse), il
//   totale annuo è un unico importo inserito manualmente (Forfettario, ETS/ASD).
export const quotePricingModeEnum = pgEnum("quote_pricing_mode", ["ITEMIZED", "FLAT"]);

// Fonte usata per precompilare l'importo di una riga (poi sempre modificabile).
export const quoteTariffSourceEnum = pgEnum("quote_tariff_source", [
  "ANC",
  "UNIONE_GIOVANI",
  "LIBERO",
]);

export const quotePeriodicityEnum = pgEnum("quote_periodicity", [
  "UNA_TANTUM",
  "MENSILE",
  "TRIMESTRALE",
  "ANNUALE",
]);

// Periodicità del forfait di un cliente (usata per calcolare la quota di
// ricavo che cade nel periodo selezionato nel report di redditività).
export const forfaitPeriodicityEnum = pgEnum("forfait_periodicity", [
  "MENSILE",
  "TRIMESTRALE",
  "ANNUALE",
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: roleEnum("role").notNull().default("EMPLOYEE"),
  active: boolean("active").notNull().default(true),
  // Costo orario pieno per lo studio (stipendio/compenso + oneri): usato per
  // calcolare il costo del lavoro nel report di redditività per cliente.
  // Nullable perché va inserito manualmente per ciascun collaboratore.
  hourlyCost: numeric("hourly_cost", { precision: 8, scale: 2, mode: "number" }),
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
  // Periodicità a cui si riferisce forfaitAmount (es. 500€ "al mese"): usata
  // per calcolare in automatico la quota di ricavo forfait nel periodo del
  // report di redditività. Nullable finché non impostata manualmente.
  forfaitPeriodicity: forfaitPeriodicityEnum("forfait_periodicity"),
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

// Le realtà emittenti (ABSV, RSVV, in futuro Studio Savia): anagrafica e
// regole automatiche (ritenuta/CP, intestazione con staff) usate per generare
// il preventivo con l'intestazione corretta.
export const quoteEntities = pgTable("quote_entities", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: quoteEntityKeyEnum("key").notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  legalForm: varchar("legal_form", { length: 100 }).notNull(),
  address: text("address").notNull(),
  taxCode: varchar("tax_code", { length: 30 }).notNull(),
  vatNumber: varchar("vat_number", { length: 30 }),
  sdiCode: varchar("sdi_code", { length: 10 }),
  pec: varchar("pec", { length: 255 }),
  phone: varchar("phone", { length: 255 }),
  signerName: varchar("signer_name", { length: 255 }).notNull(),
  logoFile: varchar("logo_file", { length: 255 }),
  // Se true, il testo del preventivo riporta "al netto di IVA e CP 4%" e
  // applica le regole di ritenuta d'acconto; se false (es. SRL) non si applica.
  appliesRitenutaCp: boolean("applies_ritenuta_cp").notNull().default(false),
  // Se true, l'intestazione del PDF mostra l'elenco esteso dei professionisti
  // con numero ODCEC, i recapiti di tutte le sedi e il timbro dell'Ordine.
  showStaffRoster: boolean("show_staff_roster").notNull().default(false),
  tariffUrl: varchar("tariff_url", { length: 255 }),
  insuranceNote: text("insurance_note"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Elenco professionisti da mostrare in intestazione per le entità con
// showStaffRoster = true (oggi solo RSVV).
export const quoteEntityStaff = pgTable("quote_entity_staff", {
  id: uuid("id").primaryKey().defaultRandom(),
  entityId: uuid("entity_id")
    .notNull()
    .references(() => quoteEntities.id, { onDelete: "cascade" }),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  odcecNumber: varchar("odcec_number", { length: 50 }),
  sortOrder: numeric("sort_order", { precision: 5, scale: 0, mode: "number" }).notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Voci di riferimento dal tariffario ANC / Unione Giovani Dottori Commercialisti,
// usate per precompilare (in sola proposta, sempre modificabile) l'importo di
// una riga di preventivo.
export const feeScheduleItems = pgTable("fee_schedule_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  category: varchar("category", { length: 255 }),
  label: varchar("label", { length: 500 }).notNull(),
  // Importo numerico "massimo" quando estraibile in modo pulito dal tariffario;
  // per le voci a formula/scaglioni resta null e conta solo la nota testuale.
  ancAmount: numeric("anc_amount", { precision: 10, scale: 2, mode: "number" }),
  ancNote: text("anc_note"),
  unioneGiovaniAmount: numeric("unione_giovani_amount", { precision: 10, scale: 2, mode: "number" }),
  unioneGiovaniNote: text("unione_giovani_note"),
  sortOrder: numeric("sort_order", { precision: 5, scale: 0, mode: "number" }).notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const quotes = pgTable("quotes", {
  id: uuid("id").primaryKey().defaultRandom(),
  entityId: uuid("entity_id")
    .notNull()
    .references(() => quoteEntities.id, { onDelete: "restrict" }),
  // Cliente esistente in anagrafica (facoltativo: un preventivo può essere
  // rivolto anche a un prospect non ancora censito come cliente).
  clientId: uuid("client_id").references(() => clients.id, { onDelete: "set null" }),
  // Intestatario e indirizzo del destinatario: copiati/inseriti al momento
  // della creazione, così il preventivo resta storicamente coerente anche se
  // l'anagrafica cliente cambia in seguito.
  recipientName: varchar("recipient_name", { length: 255 }).notNull(),
  recipientAddress: text("recipient_address"),
  family: quoteFamilyEnum("family").notNull(),
  pricingMode: quotePricingModeEnum("pricing_mode").notNull().default("ITEMIZED"),
  title: varchar("title", { length: 500 }),
  quoteDate: date("quote_date", { mode: "string" }).notNull(),
  notes: text("notes"),
  // Usato solo se pricingMode = FLAT (Forfettario, ETS/ASD): importo annuo
  // unico, da cui si deriva il trimestrale (/4).
  flatAnnualAmount: numeric("flat_annual_amount", { precision: 10, scale: 2, mode: "number" }),
  discountEnabled: boolean("discount_enabled").notNull().default(false),
  discountLabel: varchar("discount_label", { length: 500 }),
  // "PERCENT" oppure "AMOUNT"
  discountKind: varchar("discount_kind", { length: 20 }),
  discountValue: numeric("discount_value", { precision: 10, scale: 2, mode: "number" }),
  // Elenco id di quoteLines a cui si applica lo sconto (solo modalità ITEMIZED);
  // null/vuoto = si applica all'intero totale.
  discountLineIds: text("discount_line_ids"),
  createdByUserId: uuid("created_by_user_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const quoteLines = pgTable("quote_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  quoteId: uuid("quote_id")
    .notNull()
    .references(() => quotes.id, { onDelete: "cascade" }),
  sortOrder: numeric("sort_order", { precision: 5, scale: 0, mode: "number" }).notNull().default(0),
  description: text("description").notNull(),
  detail: text("detail"),
  tariffSource: quoteTariffSourceEnum("tariff_source").notNull().default("LIBERO"),
  feeScheduleItemId: uuid("fee_schedule_item_id").references(() => feeScheduleItems.id, {
    onDelete: "set null",
  }),
  // Importo della riga: obbligatorio in modalità ITEMIZED (concorre al
  // riepilogo), facoltativo/informativo in modalità FLAT.
  amount: numeric("amount", { precision: 10, scale: 2, mode: "number" }),
  periodicity: quotePeriodicityEnum("periodicity").notNull().default("UNA_TANTUM"),
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
  quotes: many(quotes),
}));

export const quoteEntitiesRelations = relations(quoteEntities, ({ many }) => ({
  staff: many(quoteEntityStaff),
  quotes: many(quotes),
}));

export const quoteEntityStaffRelations = relations(quoteEntityStaff, ({ one }) => ({
  entity: one(quoteEntities, {
    fields: [quoteEntityStaff.entityId],
    references: [quoteEntities.id],
  }),
}));

export const feeScheduleItemsRelations = relations(feeScheduleItems, ({ many }) => ({
  quoteLines: many(quoteLines),
}));

export const quotesRelations = relations(quotes, ({ one, many }) => ({
  entity: one(quoteEntities, {
    fields: [quotes.entityId],
    references: [quoteEntities.id],
  }),
  client: one(clients, {
    fields: [quotes.clientId],
    references: [clients.id],
  }),
  createdBy: one(users, {
    fields: [quotes.createdByUserId],
    references: [users.id],
  }),
  lines: many(quoteLines),
}));

export const quoteLinesRelations = relations(quoteLines, ({ one }) => ({
  quote: one(quotes, {
    fields: [quoteLines.quoteId],
    references: [quotes.id],
  }),
  feeScheduleItem: one(feeScheduleItems, {
    fields: [quoteLines.feeScheduleItemId],
    references: [feeScheduleItems.id],
  }),
}));

export const clientsRelations = relations(clients, ({ many }) => ({
  timeEntries: many(timeEntries),
  quotes: many(quotes),
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
export type QuoteEntity = typeof quoteEntities.$inferSelect;
export type NewQuoteEntity = typeof quoteEntities.$inferInsert;
export type QuoteEntityStaffMember = typeof quoteEntityStaff.$inferSelect;
export type NewQuoteEntityStaffMember = typeof quoteEntityStaff.$inferInsert;
export type FeeScheduleItem = typeof feeScheduleItems.$inferSelect;
export type NewFeeScheduleItem = typeof feeScheduleItems.$inferInsert;
export type Quote = typeof quotes.$inferSelect;
export type NewQuote = typeof quotes.$inferInsert;
export type QuoteLine = typeof quoteLines.$inferSelect;
export type NewQuoteLine = typeof quoteLines.$inferInsert;
