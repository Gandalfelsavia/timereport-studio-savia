"use server";

import { auth } from "@/auth";
import { db, clients } from "@/db";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

async function requireAdminOrSupervisor() {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPERVISOR")) {
    throw new Error("Non autorizzato.");
  }
  return session;
}

const clientSchema = z.object({
  name: z.string().min(1, "Il nome del cliente è obbligatorio"),
  billingType: z.enum(["HOURLY", "FORFAIT", "MIXED"]),
  hourlyRate: z.string().optional(),
  forfaitAmount: z.string().optional(),
  forfaitNote: z.string().optional(),
  notes: z.string().optional(),
});

export type ClientFormState = { error?: string; success?: boolean };

export async function createClient(
  _prevState: ClientFormState | undefined,
  formData: FormData
): Promise<ClientFormState> {
  await requireAdminOrSupervisor();

  const parsed = clientSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dati non validi." };
  }
  const d = parsed.data;

  await db.insert(clients).values({
    name: d.name,
    billingType: d.billingType,
    hourlyRate: d.hourlyRate ? Number(d.hourlyRate) : null,
    forfaitAmount: d.forfaitAmount ? Number(d.forfaitAmount) : null,
    forfaitNote: d.forfaitNote || null,
    notes: d.notes || null,
  });

  revalidatePath("/clienti");
  return { success: true };
}

export async function updateClient(
  _prevState: ClientFormState | undefined,
  formData: FormData
): Promise<ClientFormState> {
  await requireAdminOrSupervisor();

  const clientId = formData.get("clientId") as string;
  const parsed = clientSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dati non validi." };
  }
  const d = parsed.data;

  await db
    .update(clients)
    .set({
      name: d.name,
      billingType: d.billingType,
      hourlyRate: d.hourlyRate ? Number(d.hourlyRate) : null,
      forfaitAmount: d.forfaitAmount ? Number(d.forfaitAmount) : null,
      forfaitNote: d.forfaitNote || null,
      notes: d.notes || null,
    })
    .where(eq(clients.id, clientId));

  revalidatePath("/clienti");
  return { success: true };
}

export async function toggleClientActive(clientId: string, active: boolean) {
  await requireAdminOrSupervisor();
  await db.update(clients).set({ active }).where(eq(clients.id, clientId));
  revalidatePath("/clienti");
}
