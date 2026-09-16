import "dotenv/config";
import { db, clients, activityCategories } from "./index";
import { realCategoryNames } from "./data/real-categories";
import { realClientNames } from "./data/real-clients";

// Importa l'elenco reale di macrocategorie e clienti forniti dallo studio.
// È pensato per essere eseguito UNA VOLTA sull'ambiente di produzione (o in
// locale per provare l'app con i dati veri), ed è sicuro da rilanciare:
// salta clienti e categorie già presenti (confronto case-insensitive) invece
// di duplicarli.
//
// I clienti vengono creati con tariffazione "a tariffa oraria" ma SENZA una
// tariffa impostata (da compilare in un secondo momento nella sezione
// "Clienti" dell'app, cliente per cliente).

async function main() {
  console.log("Importazione dati reali (categorie e clienti)...");

  const existingCategories = await db.select({ name: activityCategories.name }).from(activityCategories);
  const existingCategoryNames = new Set(existingCategories.map((c) => c.name.toLowerCase()));

  const newCategories = realCategoryNames.filter(
    (name) => !existingCategoryNames.has(name.toLowerCase())
  );

  if (newCategories.length > 0) {
    await db.insert(activityCategories).values(
      newCategories.map((name, i) => ({
        name,
        sortOrder: existingCategories.length + i,
      }))
    );
  }

  const existingClients = await db.select({ name: clients.name }).from(clients);
  const existingClientNames = new Set(existingClients.map((c) => c.name.toLowerCase()));

  const newClients = realClientNames.filter(
    (name) => !existingClientNames.has(name.toLowerCase())
  );

  if (newClients.length > 0) {
    await db.insert(clients).values(
      newClients.map((name) => ({
        name,
        billingType: "HOURLY" as const,
        // Nessuna tariffa impostata: va compilata dalla sezione "Clienti".
      }))
    );
  }

  console.log(
    `Categorie: ${newCategories.length} aggiunte, ${realCategoryNames.length - newCategories.length} già presenti (saltate).`
  );
  console.log(
    `Clienti: ${newClients.length} aggiunti, ${realClientNames.length - newClients.length} già presenti (saltati).`
  );
  console.log(
    "Ricorda: i clienti importati non hanno ancora una tariffa oraria o un forfait impostati."
  );
  console.log("Importazione completata.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
