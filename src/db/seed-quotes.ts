import "dotenv/config";
import { db, quoteEntities, quoteEntityStaff, feeScheduleItems } from "./index";
import { eq } from "drizzle-orm";
import { quoteEntitiesSeed, rsvvStaffSeed } from "./data/quote-entities";
import { feeScheduleSeed } from "./data/fee-schedule";

// Importa/aggiorna le entità emittenti (ABSV, RSVV), il roster professionisti
// RSVV e il tariffario di riferimento ANC/Unione Giovani. Pensato per essere
// eseguito più volte senza duplicare: le entità vengono aggiornate per
// "key", lo staff RSVV viene ricreato da zero, le voci tariffario vengono
// saltate se già presenti (confronto sul label, case-insensitive).

async function main() {
  console.log("Seed entità di preventivo, staff e tariffario...");

  for (const entity of quoteEntitiesSeed) {
    const [existing] = await db
      .select({ id: quoteEntities.id })
      .from(quoteEntities)
      .where(eq(quoteEntities.key, entity.key))
      .limit(1);

    if (existing) {
      await db.update(quoteEntities).set(entity).where(eq(quoteEntities.id, existing.id));
      console.log(`  Entità aggiornata: ${entity.name}`);
    } else {
      await db.insert(quoteEntities).values(entity);
      console.log(`  Entità creata: ${entity.name}`);
    }
  }

  const [rsvv] = await db
    .select({ id: quoteEntities.id })
    .from(quoteEntities)
    .where(eq(quoteEntities.key, "RSVV"))
    .limit(1);

  if (rsvv) {
    const existingStaff = await db
      .select({ id: quoteEntityStaff.id })
      .from(quoteEntityStaff)
      .where(eq(quoteEntityStaff.entityId, rsvv.id));

    if (existingStaff.length === 0) {
      await db.insert(quoteEntityStaff).values(
        rsvvStaffSeed.map((s) => ({ ...s, entityId: rsvv.id }))
      );
      console.log(`  Staff RSVV importato (${rsvvStaffSeed.length} persone)`);
    } else {
      console.log("  Staff RSVV già presente, nessuna modifica");
    }
  }

  const existingFeeItems = await db.select({ label: feeScheduleItems.label }).from(feeScheduleItems);
  const existingLabels = new Set(existingFeeItems.map((i) => i.label.toLowerCase()));

  const newItems = feeScheduleSeed.filter((i) => !existingLabels.has(i.label.toLowerCase()));

  if (newItems.length > 0) {
    await db.insert(feeScheduleItems).values(
      newItems.map((item, i) => ({ ...item, sortOrder: existingFeeItems.length + i }))
    );
    console.log(`  Tariffario: aggiunte ${newItems.length} nuove voci`);
  } else {
    console.log("  Tariffario già aggiornato, nessuna nuova voce");
  }

  console.log("Fatto.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
