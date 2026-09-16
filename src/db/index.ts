import * as schema from "./schema";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import postgres from "postgres";
import { PGlite } from "@electric-sql/pglite";

// Selezione automatica del driver:
// - Se è impostata la variabile d'ambiente DATABASE_URL, si usa un vero
//   database Postgres (Supabase, Neon, Vercel Postgres, ecc.) tramite
//   il driver postgres.js — questa è la modalità da usare in produzione.
// - Altrimenti si usa PGlite (Postgres embedded, salvato su file locale)
//   per lo sviluppo/test in locale senza bisogno di un server esterno.

const databaseUrl = process.env.DATABASE_URL;

function createDb() {
  if (databaseUrl) {
    const client = postgres(databaseUrl, { max: 10, prepare: false });
    return drizzlePostgres(client, { schema });
  }
  const client = new PGlite(process.env.PGLITE_PATH || "./.pglite-data");
  return drizzlePglite(client, { schema });
}

// Riutilizza la stessa istanza tra hot-reload in sviluppo
const globalForDb = globalThis as unknown as { __db?: ReturnType<typeof createDb> };

export const db = globalForDb.__db ?? createDb();
if (process.env.NODE_ENV !== "production") {
  globalForDb.__db = db;
}

export * from "./schema";
