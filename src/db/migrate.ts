import "dotenv/config";
import path from "node:path";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  const migrationsFolder = path.join(process.cwd(), "drizzle");

  if (databaseUrl) {
    const postgres = (await import("postgres")).default;
    const { drizzle } = await import("drizzle-orm/postgres-js");
    const { migrate } = await import("drizzle-orm/postgres-js/migrator");
    const client = postgres(databaseUrl, { max: 1 });
    const db = drizzle(client);
    console.log("Applying migrations to Postgres (DATABASE_URL)...");
    await migrate(db, { migrationsFolder });
    await client.end();
  } else {
    const { PGlite } = await import("@electric-sql/pglite");
    const { drizzle } = await import("drizzle-orm/pglite");
    const { migrate } = await import("drizzle-orm/pglite/migrator");
    const client = new PGlite(process.env.PGLITE_PATH || "./.pglite-data");
    const db = drizzle(client);
    console.log("Applying migrations to local PGlite database...");
    await migrate(db, { migrationsFolder });
    await client.close();
  }

  console.log("Migrazioni applicate con successo.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
