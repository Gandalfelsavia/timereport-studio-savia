"use server";

import { auth } from "@/auth";
import { db, fiscalDeadlines, fiscalDeadlineYearlyValues } from "@/db";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { checkboxBoolean } from "@/lib/form-schema";

async function requireAdminOrSupervisor() {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPERVISOR")) {
    throw new Error("Non autorizzato.");
  }
  return session;
}

export type FiscalDeadlineFormState = { error?: string; success?: boolean };

const ruleFields = {
  title: z.string().min(1, "Il titolo è obbligatorio"),
  category: z.enum(["FISCALE", "CONTRIBUTIVO", "ASSICURATIVO_LAVORO", "DOGANALE", "TERZO_SETTORE", "TRIBUTO_LOCALE"]),
  source: z.string().min(1, "Indica l'ente/fonte"),
  ruleType: z.enum(["MONTHLY_DAY", "ANNUAL_DATE", "DAYS_AFTER_YEAR_END", "MANUAL_YEARLY"]),
  ruleDay: z.string().optional(),
  ruleMonth: z.string().optional(),
  ruleDaysAfterYearEnd: z.string().optional(),
  augustSuspension: checkboxBoolean(),
  needsReview: checkboxBoolean(),
  notes: z.string().optional(),
};

const createSchema = z.object(ruleFields);
const updateSchema = z.object({ ...ruleFields, deadlineId: z.string().uuid() });

function toRuleValues(d: z.infer<typeof createSchema>) {
  return {
    title: d.title,
    category: d.category,
    source: d.source,
    ruleType: d.ruleType,
    ruleDay: d.ruleType === "MONTHLY_DAY" || d.ruleType === "ANNUAL_DATE" ? (d.ruleDay ? Number(d.ruleDay) : null) : null,
    ruleMonth: d.ruleType === "ANNUAL_DATE" ? (d.ruleMonth ? Number(d.ruleMonth) : null) : null,
    ruleDaysAfterYearEnd:
      d.ruleType === "DAYS_AFTER_YEAR_END" ? (d.ruleDaysAfterYearEnd ? Number(d.ruleDaysAfterYearEnd) : null) : null,
    augustSuspension: d.augustSuspension,
    needsReview: d.needsReview,
    notes: d.notes || null,
  };
}

export async function createFiscalDeadline(
  _prevState: FiscalDeadlineFormState | undefined,
  formData: FormData
): Promise<FiscalDeadlineFormState> {
  await requireAdminOrSupervisor();

  const parsed = createSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dati non validi." };
  }

  await db.insert(fiscalDeadlines).values(toRuleValues(parsed.data));

  revalidatePath("/scadenze-fiscali");
  return { success: true };
}

export async function updateFiscalDeadline(
  _prevState: FiscalDeadlineFormState | undefined,
  formData: FormData
): Promise<FiscalDeadlineFormState> {
  await requireAdminOrSupervisor();

  const parsed = updateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dati non validi." };
  }
  const d = parsed.data;

  await db.update(fiscalDeadlines).set(toRuleValues(d)).where(eq(fiscalDeadlines.id, d.deadlineId));

  revalidatePath("/scadenze-fiscali");
  return { success: true };
}

export async function toggleFiscalDeadlineActive(deadlineId: string, active: boolean) {
  await requireAdminOrSupervisor();
  await db.update(fiscalDeadlines).set({ active }).where(eq(fiscalDeadlines.id, deadlineId));
  revalidatePath("/scadenze-fiscali");
}

const confirmSchema = z.object({
  deadlineId: z.string().uuid(),
  year: z.string().regex(/^\d{4}$/),
  date: z.string().min(1, "Indica la data"),
  note: z.string().optional(),
});

// Conferma (o corregge) la data di una scadenza per un anno specifico: usata
// sia per le voci "da verificare" una volta controllate, sia per le
// MANUAL_YEARLY che non hanno una regola fissa. Salvare qui NON richiede
// alcuna modifica al codice o un nuovo deploy: è un dato nel database,
// modificabile ogni anno dall'interfaccia stessa.
export async function confirmFiscalDeadlineYear(
  _prevState: FiscalDeadlineFormState | undefined,
  formData: FormData
): Promise<FiscalDeadlineFormState> {
  const session = await requireAdminOrSupervisor();

  const parsed = confirmSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dati non validi." };
  }
  const d = parsed.data;
  const year = Number(d.year);

  const [existing] = await db
    .select({ id: fiscalDeadlineYearlyValues.id })
    .from(fiscalDeadlineYearlyValues)
    .where(
      and(eq(fiscalDeadlineYearlyValues.deadlineId, d.deadlineId), eq(fiscalDeadlineYearlyValues.year, year))
    )
    .limit(1);

  const values = {
    date: d.date,
    note: d.note || null,
    confirmedByUserId: session.user.id,
    confirmedAt: new Date(),
  };

  if (existing) {
    await db.update(fiscalDeadlineYearlyValues).set(values).where(eq(fiscalDeadlineYearlyValues.id, existing.id));
  } else {
    await db.insert(fiscalDeadlineYearlyValues).values({ deadlineId: d.deadlineId, year, ...values });
  }

  revalidatePath("/scadenze-fiscali");
  return { success: true };
}
