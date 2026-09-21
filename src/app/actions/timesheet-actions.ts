"use server";

import { auth } from "@/auth";
import { db, timeEntries } from "@/db";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { checkboxBoolean } from "@/lib/form-schema";

const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

const entrySchema = z
  .object({
    clientId: z.string().uuid(),
    categoryId: z.string().uuid({ message: "Seleziona una macrocategoria" }),
    date: z.string().min(1),
    description: z.string().min(1, "Descrivi l'attività svolta"),
    startTime: z.string().regex(timePattern, "Indica l'ora di inizio"),
    endTime: z.string().regex(timePattern, "Indica l'ora di fine"),
    billable: checkboxBoolean(),
    billingAmount: z.coerce.number().nonnegative().optional().nullable(),
    expenseAmount: z.coerce.number().nonnegative().optional().nullable(),
    expenseNote: z.string().optional().nullable(),
  })
  .transform((data, ctx) => {
    const hours = computeHours(data.startTime, data.endTime);
    if (hours === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "L'ora di fine deve essere successiva all'ora di inizio",
        path: ["endTime"],
      });
      return z.NEVER;
    }
    return { ...data, hours };
  });

// Calcola le ore come differenza tra ora di fine e ora di inizio (stesso giorno),
// arrotondando al quarto d'ora più vicino.
function computeHours(startTime: string, endTime: string): number | null {
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  const diffMinutes = endMinutes - startMinutes;
  if (diffMinutes <= 0) return null;
  const hours = Math.round((diffMinutes / 60) * 4) / 4;
  return hours;
}

export type TimesheetFormState = { error?: string; success?: boolean };

// Un'attività registrata influenza più pagine (il proprio timesheet, i report
// per cliente, per collaboratore e la panoramica generale): rivalidiamole tutte
// dopo ogni creazione/modifica/eliminazione, così i dati aggiornati compaiono
// subito ovunque, senza bisogno di ricaricare manualmente la pagina.
function revalidateTimesheetPaths() {
  revalidatePath("/timesheet");
  revalidatePath("/reports/clients");
  revalidatePath("/reports/clients/[clientId]", "page");
  revalidatePath("/reports/collaboratori");
  revalidatePath("/reports/collaboratori/[userId]", "page");
  revalidatePath("/reports/overview");
  revalidatePath("/");
}

function readEntryInput(formData: FormData) {
  return {
    clientId: formData.get("clientId"),
    categoryId: formData.get("categoryId"),
    date: formData.get("date"),
    description: formData.get("description"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    billable: formData.get("billable") === "on",
    billingAmount: formData.get("billingAmount") || null,
    expenseAmount: formData.get("expenseAmount") || null,
    expenseNote: formData.get("expenseNote") || null,
  };
}

export async function createTimeEntry(
  _prevState: TimesheetFormState | undefined,
  formData: FormData
): Promise<TimesheetFormState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Non autenticato." };

  const parsed = entrySchema.safeParse(readEntryInput(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dati non validi." };
  }

  await db.insert(timeEntries).values({
    userId: session.user.id,
    clientId: parsed.data.clientId,
    categoryId: parsed.data.categoryId,
    date: parsed.data.date,
    description: parsed.data.description,
    startTime: parsed.data.startTime,
    endTime: parsed.data.endTime,
    hours: parsed.data.hours,
    billable: parsed.data.billable,
    billingAmount: parsed.data.billable ? parsed.data.billingAmount ?? null : null,
    expenseAmount: parsed.data.billable ? parsed.data.expenseAmount ?? null : null,
    expenseNote: parsed.data.billable ? parsed.data.expenseNote || null : null,
  });

  revalidateTimesheetPaths();
  return { success: true };
}

export async function deleteTimeEntry(entryId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non autenticato.");

  const isPrivileged = session.user.role === "ADMIN" || session.user.role === "SUPERVISOR";

  await db
    .delete(timeEntries)
    .where(
      isPrivileged
        ? eq(timeEntries.id, entryId)
        : and(eq(timeEntries.id, entryId), eq(timeEntries.userId, session.user.id))
    );

  revalidateTimesheetPaths();
}

export async function updateTimeEntry(
  _prevState: TimesheetFormState | undefined,
  formData: FormData
): Promise<TimesheetFormState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Non autenticato." };

  const entryId = formData.get("entryId") as string;
  const parsed = entrySchema.safeParse(readEntryInput(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dati non validi." };
  }

  const isPrivileged = session.user.role === "ADMIN" || session.user.role === "SUPERVISOR";

  await db
    .update(timeEntries)
    .set({
      clientId: parsed.data.clientId,
      categoryId: parsed.data.categoryId,
      date: parsed.data.date,
      description: parsed.data.description,
      startTime: parsed.data.startTime,
      endTime: parsed.data.endTime,
      hours: parsed.data.hours,
      billable: parsed.data.billable,
      billingAmount: parsed.data.billable ? parsed.data.billingAmount ?? null : null,
      expenseAmount: parsed.data.billable ? parsed.data.expenseAmount ?? null : null,
      expenseNote: parsed.data.billable ? parsed.data.expenseNote || null : null,
      updatedAt: new Date(),
    })
    .where(
      isPrivileged
        ? eq(timeEntries.id, entryId)
        : and(eq(timeEntries.id, entryId), eq(timeEntries.userId, session.user.id))
    );

  revalidateTimesheetPaths();
  return { success: true };
}
