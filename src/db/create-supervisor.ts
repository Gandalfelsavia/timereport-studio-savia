import "dotenv/config";
import bcrypt from "bcryptjs";
import { db, users } from "./index";
import { eq } from "drizzle-orm";

// Crea il primo utente supervisore in un database "pulito" (senza dati demo),
// pensato per l'avvio in produzione. Non crea clienti, categorie o attività
// di esempio: usa `db:import-real-data` per quelle.
//
// Puoi personalizzare nome/email/password con variabili d'ambiente, es.:
//   SUPERVISOR_NAME="Fabio Savia" SUPERVISOR_EMAIL="fabio@studiosavia.com" \
//   SUPERVISOR_PASSWORD="scegli-una-password-robusta" npm run db:create-supervisor

async function main() {
  const name = process.env.SUPERVISOR_NAME || "Fabio Savia";
  const email = (process.env.SUPERVISOR_EMAIL || "fabio@studiosavia.com").toLowerCase().trim();
  const password = process.env.SUPERVISOR_PASSWORD || "cambiami123";

  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing) {
    console.log(`Esiste già un utente con email ${email}, nessuna modifica effettuata.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await db.insert(users).values({ name, email, passwordHash, role: "SUPERVISOR" });

  console.log(`Utente supervisore creato: ${email}`);
  if (!process.env.SUPERVISOR_PASSWORD) {
    console.log(`Password iniziale: ${password} — cambiala al primo accesso.`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
