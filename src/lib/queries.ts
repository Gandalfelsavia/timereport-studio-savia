import { db, clients, timeEntries, users, activityCategories } from "@/db";
import { and, asc, desc, eq, gte, lte } from "drizzle-orm";
import { entryFeeAmount, entryExpenseAmount, entryTotalAmount } from "@/lib/billing";

export async function getActiveClients() {
  return db
    .select()
    .from(clients)
    .where(eq(clients.active, true))
    .orderBy(asc(clients.name));
}

export async function getAllClients() {
  return db.select().from(clients).orderBy(asc(clients.name));
}

export async function getActiveCategories() {
  return db
    .select()
    .from(activityCategories)
    .where(eq(activityCategories.active, true))
    .orderBy(asc(activityCategories.sortOrder), asc(activityCategories.name));
}

export async function getAllCategories() {
  return db
    .select()
    .from(activityCategories)
    .orderBy(asc(activityCategories.sortOrder), asc(activityCategories.name));
}

export async function getAllEmployees() {
  return db
    .select()
    .from(users)
    .where(eq(users.active, true))
    .orderBy(asc(users.name));
}

export async function getAllUsers() {
  return db.select().from(users).orderBy(asc(users.name));
}

export async function getUserEntries(userId: string, from?: string, to?: string) {
  const conditions = [eq(timeEntries.userId, userId)];
  if (from) conditions.push(gte(timeEntries.date, from));
  if (to) conditions.push(lte(timeEntries.date, to));

  return db
    .select({
      id: timeEntries.id,
      date: timeEntries.date,
      description: timeEntries.description,
      startTime: timeEntries.startTime,
      endTime: timeEntries.endTime,
      hours: timeEntries.hours,
      billable: timeEntries.billable,
      billingAmount: timeEntries.billingAmount,
      expenseAmount: timeEntries.expenseAmount,
      expenseNote: timeEntries.expenseNote,
      clientId: timeEntries.clientId,
      clientName: clients.name,
      categoryId: timeEntries.categoryId,
      categoryName: activityCategories.name,
    })
    .from(timeEntries)
    .innerJoin(clients, eq(timeEntries.clientId, clients.id))
    .innerJoin(activityCategories, eq(timeEntries.categoryId, activityCategories.id))
    .where(and(...conditions))
    .orderBy(desc(timeEntries.date), desc(timeEntries.createdAt));
}

export async function getClientReport(clientId: string, from: string, to: string) {
  const [client] = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);
  if (!client) return null;

  const entries = await db
    .select({
      id: timeEntries.id,
      date: timeEntries.date,
      description: timeEntries.description,
      hours: timeEntries.hours,
      billable: timeEntries.billable,
      billingAmount: timeEntries.billingAmount,
      expenseAmount: timeEntries.expenseAmount,
      expenseNote: timeEntries.expenseNote,
      userName: users.name,
      categoryName: activityCategories.name,
    })
    .from(timeEntries)
    .innerJoin(users, eq(timeEntries.userId, users.id))
    .innerJoin(activityCategories, eq(timeEntries.categoryId, activityCategories.id))
    .where(
      and(
        eq(timeEntries.clientId, clientId),
        gte(timeEntries.date, from),
        lte(timeEntries.date, to)
      )
    )
    .orderBy(asc(timeEntries.date));

  const billableEntries = entries.filter((e) => e.billable);
  const forfaitEntries = entries.filter((e) => !e.billable);

  const rate = client.hourlyRate ?? 0;
  const billableHours = billableEntries.reduce((sum, e) => sum + e.hours, 0);
  const forfaitHours = forfaitEntries.reduce((sum, e) => sum + e.hours, 0);
  const feeAmount = billableEntries.reduce((sum, e) => sum + entryFeeAmount(e, rate), 0);
  const expensesAmount = billableEntries.reduce((sum, e) => sum + entryExpenseAmount(e), 0);
  const amountToInvoice = feeAmount + expensesAmount;

  // Tempo impiegato suddiviso per macrocategoria (per il grafico di riepilogo),
  // ordinato dalla categoria più consistente alla meno consistente.
  const categoryHours = new Map<string, number>();
  for (const e of entries) {
    categoryHours.set(e.categoryName, (categoryHours.get(e.categoryName) ?? 0) + e.hours);
  }
  const categoryBreakdown = Array.from(categoryHours, ([categoryName, hours]) => ({
    categoryName,
    hours,
  })).sort((a, b) => b.hours - a.hours);

  return {
    client,
    billableEntries,
    forfaitEntries,
    billableHours,
    forfaitHours,
    feeAmount,
    expensesAmount,
    amountToInvoice,
    categoryBreakdown,
  };
}

// Riepilogo per tutti i clienti nel periodo. Include SOLO i clienti che hanno
// almeno un'attività registrata nel periodo (i clienti senza movimenti non
// vengono restituiti). Usa un'unica query per tutte le attività del periodo
// invece di una query per cliente: con centinaia di clienti, interrogare il
// database una volta per ciascuno rendeva questa pagina molto lenta.
export async function getAllClientsReportSummary(from: string, to: string) {
  const allClients = await db.select().from(clients).orderBy(asc(clients.name));

  const entries = await db
    .select({
      clientId: timeEntries.clientId,
      hours: timeEntries.hours,
      billable: timeEntries.billable,
      billingAmount: timeEntries.billingAmount,
      expenseAmount: timeEntries.expenseAmount,
    })
    .from(timeEntries)
    .where(and(gte(timeEntries.date, from), lte(timeEntries.date, to)));

  const byClient = new Map<string, typeof entries>();
  for (const e of entries) {
    const list = byClient.get(e.clientId);
    if (list) list.push(e);
    else byClient.set(e.clientId, [e]);
  }

  const results = [];
  for (const client of allClients) {
    const clientEntries = byClient.get(client.id);
    if (!clientEntries || clientEntries.length === 0) continue; // nessun movimento: escluso

    const billableEntries = clientEntries.filter((e) => e.billable);
    const billableHours = billableEntries.reduce((s, e) => s + e.hours, 0);
    const forfaitHours = clientEntries.filter((e) => !e.billable).reduce((s, e) => s + e.hours, 0);
    const rate = client.hourlyRate ?? 0;
    const amountToInvoice = billableEntries.reduce((s, e) => s + entryTotalAmount(e, rate), 0);
    results.push({
      client,
      billableHours,
      forfaitHours,
      amountToInvoice,
    });
  }
  return results;
}

export async function getCollaboratorReport(userId: string, from: string, to: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return null;

  const entries = await db
    .select({
      id: timeEntries.id,
      date: timeEntries.date,
      description: timeEntries.description,
      hours: timeEntries.hours,
      billable: timeEntries.billable,
      billingAmount: timeEntries.billingAmount,
      expenseAmount: timeEntries.expenseAmount,
      clientId: timeEntries.clientId,
      clientName: clients.name,
      clientRate: clients.hourlyRate,
      categoryName: activityCategories.name,
    })
    .from(timeEntries)
    .innerJoin(clients, eq(timeEntries.clientId, clients.id))
    .innerJoin(activityCategories, eq(timeEntries.categoryId, activityCategories.id))
    .where(
      and(
        eq(timeEntries.userId, userId),
        gte(timeEntries.date, from),
        lte(timeEntries.date, to)
      )
    )
    .orderBy(asc(timeEntries.date));

  const totalHours = entries.reduce((s, e) => s + e.hours, 0);
  const billableHours = entries.filter((e) => e.billable).reduce((s, e) => s + e.hours, 0);
  const forfaitHours = totalHours - billableHours;
  const revenue = entries
    .filter((e) => e.billable)
    .reduce((s, e) => s + entryTotalAmount(e, e.clientRate ?? 0), 0);

  const byClient = new Map<
    string,
    { clientName: string; hours: number; billableHours: number; revenue: number }
  >();
  for (const e of entries) {
    const cur = byClient.get(e.clientId) ?? {
      clientName: e.clientName,
      hours: 0,
      billableHours: 0,
      revenue: 0,
    };
    cur.hours += e.hours;
    if (e.billable) {
      cur.billableHours += e.hours;
      cur.revenue += entryTotalAmount(e, e.clientRate ?? 0);
    }
    byClient.set(e.clientId, cur);
  }

  return {
    user,
    entries,
    totalHours,
    billableHours,
    forfaitHours,
    revenue,
    byClient: Array.from(byClient.values()),
  };
}

export async function getOverviewReport(from: string, to: string) {
  const allUsers = await db.select().from(users).where(eq(users.active, true));
  const collaboratorSummaries = [];
  for (const u of allUsers) {
    const report = await getCollaboratorReport(u.id, from, to);
    if (report) {
      collaboratorSummaries.push({
        user: u,
        totalHours: report.totalHours,
        billableHours: report.billableHours,
        forfaitHours: report.forfaitHours,
        revenue: report.revenue,
      });
    }
  }

  const clientSummaries = await getAllClientsReportSummary(from, to);

  const totalRevenue = collaboratorSummaries.reduce((s, c) => s + c.revenue, 0);
  const totalHours = collaboratorSummaries.reduce((s, c) => s + c.totalHours, 0);

  return { collaboratorSummaries, clientSummaries, totalRevenue, totalHours };
}
