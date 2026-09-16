import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  numeric,
  date,
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
  hours: numeric("hours", { precision: 5, scale: 2, mode: "number" }).notNull(),
  // true = attività da fatturare extra al cliente; false = inclusa nel forfait/non fatturabile
  billable: boolean("billable").notNull().default(true),
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
