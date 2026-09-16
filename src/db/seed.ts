import "dotenv/config";
import bcrypt from "bcryptjs";
import { db, users, clients, timeEntries, activityCategories } from "./index";

async function main() {
  console.log("Seeding database...");

  const passwordHash = await bcrypt.hash("cambiami123", 10);

  const [supervisor] = await db
    .insert(users)
    .values({
      name: "Fabio Savia",
      email: "fabio@studiosavia.com",
      passwordHash,
      role: "SUPERVISOR",
    })
    .returning();

  const [admin] = await db
    .insert(users)
    .values({
      name: "Amministrazione",
      email: "admin@studiosavia.com",
      passwordHash,
      role: "ADMIN",
    })
    .returning();

  const [dip1] = await db
    .insert(users)
    .values({
      name: "Giulia Bianchi",
      email: "giulia@studiosavia.com",
      passwordHash,
      role: "EMPLOYEE",
    })
    .returning();

  const [dip2] = await db
    .insert(users)
    .values({
      name: "Marco Rossi",
      email: "marco@studiosavia.com",
      passwordHash,
      role: "EMPLOYEE",
    })
    .returning();

  const [clienteA] = await db
    .insert(clients)
    .values({
      name: "Alfa S.r.l.",
      billingType: "HOURLY",
      hourlyRate: 90,
      notes: "Cliente a tariffa oraria",
    })
    .returning();

  const [clienteB] = await db
    .insert(clients)
    .values({
      name: "Beta Associazione ETS",
      billingType: "FORFAIT",
      forfaitAmount: 500,
      forfaitNote: "Forfait mensile per adempimenti ordinari",
    })
    .returning();

  const [clienteC] = await db
    .insert(clients)
    .values({
      name: "Gamma Costruzioni S.p.A.",
      billingType: "MIXED",
      hourlyRate: 110,
      forfaitAmount: 800,
      forfaitNote: "Forfait per contabilità ordinaria, extra a consulenza fatturati a ore",
    })
    .returning();

  const categoryNames = [
    "Prima nota",
    "Bilancio",
    "Pratiche",
    "Dichiarazioni fiscali",
    "Consulenza",
  ];
  const insertedCategories = await db
    .insert(activityCategories)
    .values(categoryNames.map((name, i) => ({ name, sortOrder: i })))
    .returning();
  const categoryByName = Object.fromEntries(insertedCategories.map((c) => [c.name, c]));

  const today = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const daysAgo = (n: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - n);
    return d;
  };

  await db.insert(timeEntries).values([
    {
      userId: dip1.id,
      clientId: clienteA.id,
      categoryId: categoryByName["Dichiarazioni fiscali"].id,
      date: iso(daysAgo(1)),
      description: "Predisposizione dichiarazione IVA trimestrale",
      hours: 2.5,
      billable: true,
    },
    {
      userId: dip1.id,
      clientId: clienteB.id,
      categoryId: categoryByName["Prima nota"].id,
      date: iso(daysAgo(1)),
      description: "Registrazione fatture mese corrente",
      hours: 1.5,
      billable: false,
    },
    {
      userId: dip1.id,
      clientId: clienteC.id,
      categoryId: categoryByName["Consulenza"].id,
      date: iso(daysAgo(2)),
      description: "Consulenza straordinaria su operazione societaria",
      hours: 3,
      billable: true,
    },
    {
      userId: dip2.id,
      clientId: clienteA.id,
      categoryId: categoryByName["Prima nota"].id,
      date: iso(daysAgo(3)),
      description: "Riconciliazione bancaria",
      hours: 1,
      billable: true,
    },
    {
      userId: dip2.id,
      clientId: clienteC.id,
      categoryId: categoryByName["Pratiche"].id,
      date: iso(daysAgo(4)),
      description: "Adempimenti ordinari contabilità",
      hours: 4,
      billable: false,
    },
    {
      userId: dip2.id,
      clientId: clienteB.id,
      categoryId: categoryByName["Bilancio"].id,
      date: iso(daysAgo(5)),
      description: "Predisposizione bilancio ETS",
      hours: 2,
      billable: false,
    },
  ]);

  console.log("Utenti creati:");
  console.log(" - Supervisor:", supervisor.email, "/ password: cambiami123");
  console.log(" - Admin:", admin.email, "/ password: cambiami123");
  console.log(" - Dipendente:", dip1.email, "/ password: cambiami123");
  console.log(" - Dipendente:", dip2.email, "/ password: cambiami123");
  console.log("Seed completato.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
