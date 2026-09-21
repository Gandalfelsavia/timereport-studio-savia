"use server";

import { auth } from "@/auth";
import { db, quotes, quoteLines, quoteEntities } from "@/db";
import { eq, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { quoteFamilyTemplates, quoteFamilyPricingMode } from "@/lib/quote-templates";
import { stringifyDiscountLineIds } from "@/lib/quotes";
import { checkboxBoolean } from "@/lib/form-schema";

async function requireAdminOrSupervisor() {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPERVISOR")) {
    throw new Error("Non autorizzato.");
  }
  return session;
}

function revalidateQuotePaths(quoteId?: string) {
  revalidatePath("/preventivi");
  if (quoteId) revalidatePath(`/preventivi/${quoteId}`);
}

export type QuoteFormState = { error?: string; success?: boolean };

const createQuoteSchema = z.object({
  entityId: z.string().uuid(),
  clientId: z.string().optional(),
  recipientName: z.string().min(1, "Il nome del destinatario è obbligatorio"),
  recipientAddress: z.string().optional(),
  family: z.enum(["SOCIETA", "RAPPRESENTANZA_FISCALE", "ETS_ASD", "DITTA_INDIVIDUALE", "FORFETTARIO"]),
  title: z.string().optional(),
  quoteDate: z.string().min(1),
});

export async function createQuote(_prevState: QuoteFormState | undefined, formData: FormData): Promise<QuoteFormState> {
  const session = await requireAdminOrSupervisor();

  const parsed = createQuoteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dati non validi." };
  }
  const d = parsed.data;
  const pricingMode = quoteFamilyPricingMode[d.family];

  const [quote] = await db
    .insert(quotes)
    .values({
      entityId: d.entityId,
      clientId: d.clientId || null,
      recipientName: d.recipientName,
      recipientAddress: d.recipientAddress || null,
      family: d.family,
      pricingMode,
      title: d.title || null,
      quoteDate: d.quoteDate,
      createdByUserId: session.user.id,
    })
    .returning();

  const template = quoteFamilyTemplates[d.family];
  if (template.length > 0) {
    await db.insert(quoteLines).values(
      template.map((line, i) => ({
        quoteId: quote.id,
        sortOrder: i,
        description: line.description,
        detail: line.detail,
        tariffSource: line.tariffSource,
        amount: line.amount,
        periodicity: line.periodicity,
      }))
    );
  }

  revalidateQuotePaths();
  redirect(`/preventivi/${quote.id}`);
}

const updateQuoteHeaderSchema = z.object({
  quoteId: z.string().uuid(),
  entityId: z.string().uuid(),
  clientId: z.string().optional(),
  recipientName: z.string().min(1, "Il nome del destinatario è obbligatorio"),
  recipientAddress: z.string().optional(),
  title: z.string().optional(),
  quoteDate: z.string().min(1),
  notes: z.string().optional(),
  flatAnnualAmount: z.string().optional(),
});

export async function updateQuoteHeader(
  _prevState: QuoteFormState | undefined,
  formData: FormData
): Promise<QuoteFormState> {
  await requireAdminOrSupervisor();
  const parsed = updateQuoteHeaderSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dati non validi." };
  }
  const d = parsed.data;

  await db
    .update(quotes)
    .set({
      entityId: d.entityId,
      clientId: d.clientId || null,
      recipientName: d.recipientName,
      recipientAddress: d.recipientAddress || null,
      title: d.title || null,
      quoteDate: d.quoteDate,
      notes: d.notes || null,
      flatAnnualAmount: d.flatAnnualAmount ? Number(d.flatAnnualAmount) : null,
      updatedAt: new Date(),
    })
    .where(eq(quotes.id, d.quoteId));

  revalidateQuotePaths(d.quoteId);
  return { success: true };
}

const lineSchema = z.object({
  quoteId: z.string().uuid(),
  description: z.string().min(1, "La descrizione è obbligatoria"),
  detail: z.string().optional(),
  tariffSource: z.enum(["ANC", "UNIONE_GIOVANI", "LIBERO"]),
  feeScheduleItemId: z.string().optional(),
  amount: z.string().optional(),
  periodicity: z.enum(["UNA_TANTUM", "MENSILE", "TRIMESTRALE", "ANNUALE"]),
});

export async function addQuoteLine(_prevState: QuoteFormState | undefined, formData: FormData): Promise<QuoteFormState> {
  await requireAdminOrSupervisor();
  const parsed = lineSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dati non validi." };
  }
  const d = parsed.data;

  const existing = await db
    .select({ sortOrder: quoteLines.sortOrder })
    .from(quoteLines)
    .where(eq(quoteLines.quoteId, d.quoteId))
    .orderBy(asc(quoteLines.sortOrder));

  await db.insert(quoteLines).values({
    quoteId: d.quoteId,
    sortOrder: existing.length,
    description: d.description,
    detail: d.detail || null,
    tariffSource: d.tariffSource,
    feeScheduleItemId: d.feeScheduleItemId || null,
    amount: d.amount ? Number(d.amount) : null,
    periodicity: d.periodicity,
  });

  revalidateQuotePaths(d.quoteId);
  return { success: true };
}

const updateLineSchema = lineSchema.extend({ lineId: z.string().uuid() });

export async function updateQuoteLine(
  _prevState: QuoteFormState | undefined,
  formData: FormData
): Promise<QuoteFormState> {
  await requireAdminOrSupervisor();
  const parsed = updateLineSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dati non validi." };
  }
  const d = parsed.data;

  await db
    .update(quoteLines)
    .set({
      description: d.description,
      detail: d.detail || null,
      tariffSource: d.tariffSource,
      feeScheduleItemId: d.feeScheduleItemId || null,
      amount: d.amount ? Number(d.amount) : null,
      periodicity: d.periodicity,
    })
    .where(eq(quoteLines.id, d.lineId));

  revalidateQuotePaths(d.quoteId);
  return { success: true };
}

export async function deleteQuoteLine(lineId: string, quoteId: string) {
  await requireAdminOrSupervisor();
  await db.delete(quoteLines).where(eq(quoteLines.id, lineId));
  revalidateQuotePaths(quoteId);
}

const discountSchema = z.object({
  quoteId: z.string().uuid(),
  discountEnabled: checkboxBoolean(),
  discountLabel: z.string().optional(),
  discountKind: z.enum(["PERCENT", "AMOUNT"]).optional(),
  discountValue: z.string().optional(),
  discountLineIds: z.array(z.string()).optional(),
});

export async function updateQuoteDiscount(formData: FormData) {
  await requireAdminOrSupervisor();
  const raw = Object.fromEntries(formData);
  const parsed = discountSchema.safeParse({
    ...raw,
    discountLineIds: formData.getAll("discountLineIds"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dati non validi." };
  }
  const d = parsed.data;

  await db
    .update(quotes)
    .set({
      discountEnabled: d.discountEnabled,
      discountLabel: d.discountEnabled ? d.discountLabel || null : null,
      discountKind: d.discountEnabled ? d.discountKind || "PERCENT" : null,
      discountValue: d.discountEnabled && d.discountValue ? Number(d.discountValue) : null,
      discountLineIds: d.discountEnabled ? stringifyDiscountLineIds(d.discountLineIds ?? []) : null,
      updatedAt: new Date(),
    })
    .where(eq(quotes.id, d.quoteId));

  revalidateQuotePaths(d.quoteId);
  return { success: true };
}

export async function deleteQuote(quoteId: string) {
  await requireAdminOrSupervisor();
  await db.delete(quotes).where(eq(quotes.id, quoteId));
  revalidateQuotePaths();
  redirect("/preventivi");
}
