import "dotenv/config";
import { db, fiscalDeadlines } from "./index";
import { eq } from "drizzle-orm";
import { fiscalDeadlinesSeed } from "./data/fiscal-deadlines";

// Importa lo scadenzario fiscale generico. Idempotente: le voci esistenti
// vengono riconosciute per titolo (case-insensitive) e aggiornate, non
// duplicate, così da poter correggere i dati del seed e rieseguirlo in
// sicurezza senza perdere eventuali conferme/override già inseriti a mano
// in fiscal_deadline_yearly_values (collegati per id, non toccati qui).
async function main() {
  console.log("Seed scadenzario fiscale...");
  let created = 0;
  let updated = 0;

  for (const deadline of fiscalDeadlinesSeed) {
    const [existing] = await db
      .select({ id: fiscalDeadlines.id })
      .from(fiscalDeadlines)
      .where(eq(fiscalDeadlines.title, deadline.title))
      .limit(1);

    if (existing) {
      await db.update(fiscalDeadlines).set(deadline).where(eq(fiscalDeadlines.id, existing.id));
      updated++;
    } else {
      await db.insert(fiscalDeadlines).values(deadline);
      created++;
    }
  }

  console.log(`Scadenzario: ${created} voci create, ${updated} aggiornate.`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
