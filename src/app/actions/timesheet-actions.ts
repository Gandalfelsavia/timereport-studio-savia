"use server";

import { auth } from "@/auth";
import { db, timeEntries } from "@/db";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const entrySchema = z.object({
  clientId: z.string().uuid(),
  categoryId: z.string().uuid({ message: "Seleziona una macrocategoria" }),
  date: z.string().min(1),
  description: z.string().min(1, "Descrivi l'attività svolta"),
  hours: z.coerce.number().positive("Le ore devono essere maggiori di zero").max(24),
  billable: z.coerce.boolean(),
});

export type TimesheetFormState = { error?: string; success?: boolean };

export async function createTimeEntry(
  _prevState: TimesheetFormState | undefined,
  formData: FormData
): Promise<TimesheetFormState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Non autenticato." };

  const parsed = entrySchema.safeParse({
    clientId: formData.get("clientId"),
    categoryId: formData.get("categoryId"),
    date: formData.get("date"),
    description: formData.get("description"),
    hours: formData.get("hours"),
    billable: formData.get("billable") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dati non validi." };
  }

  await db.insert(timeEntries).values({
    userId: session.user.id,
    clientId: parsed.data.clientId,
    categoryId: parsed.data.categoryId,
    date: parsed.data.date,
    description: parsed.data.description,
    hours: parsed.data.hours,
    billable: parsed.data.billable,
  });

  revalidatePath("/timesheet");
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

  revalidatePath("/timesheet");
}

export async function updateTimeEntry(
  _prevState: TimesheetFormState | undefined,
  formData: FormData
): Promise<TimesheetFormState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Non autenticato." };

  const entryId = formData.get("entryId") as string;
  const parsed = entrySchema.safeParse({
    clientId: formData.get("clientId"),
    categoryId: formData.get("categoryId"),
    date: formData.get("date"),
    description: formData.get("description"),
    hours: formData.get("hours"),
    billable: formData.get("billable") === "on",
  });

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
      hours: parsed.data.hours,
      billable: parsed.data.billable,
      updatedAt: new Date(),
    })
    .where(
      isPrivileged
        ? eq(timeEntries.id, entryId)
        : and(eq(timeEntries.id, entryId), eq(timeEntries.userId, session.user.id))
    );

  revalidatePath("/timesheet");
  return { success: true };
}
