"use server";

import { auth } from "@/auth";
import { db, clients } from "@/db";
import { eq } from "drizzle-orm";
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

const clientSchema = z.object({
  name: z.string().min(1, "Il nome del cliente è obbligatorio"),
  billingType: z.enum(["HOURLY", "FORFAIT", "MIXED"]),
  hourlyRate: z.string().optional(),
  forfaitAmount: z.string().optional(),
  forfaitPeriodicity: z.enum(["MENSILE", "TRIMESTRALE", "ANNUALE"]).optional(),
  forfaitNote: z.string().optional(),
  notes: z.string().optional(),
  // Anagrafica estesa: tutti i campi seguenti sono facoltativi.
  address: z.string().optional(),
  vatNumber: z.string().optional(),
  taxCode: z.string().optional(),
  sdiCode: z.string().optional(),
  pec: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  hasLegalRepresentative: checkboxBoolean(),
  legalRepFirstName: z.string().optional(),
  legalRepLastName: z.string().optional(),
  legalRepBirthDate: z.string().optional(),
  legalRepBirthPlace: z.string().optional(),
  legalRepResidence: z.string().optional(),
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
    forfaitPeriodicity: d.forfaitPeriodicity ?? null,
    forfaitNote: d.forfaitNote || null,
    notes: d.notes || null,
    address: d.address || null,
    vatNumber: d.vatNumber || null,
    taxCode: d.taxCode || null,
    sdiCode: d.sdiCode || null,
    pec: d.pec || null,
    email: d.email || null,
    phone: d.phone || null,
    hasLegalRepresentative: d.hasLegalRepresentative,
    legalRepFirstName: d.hasLegalRepresentative ? d.legalRepFirstName || null : null,
    legalRepLastName: d.hasLegalRepresentative ? d.legalRepLastName || null : null,
    legalRepBirthDate: d.hasLegalRepresentative ? d.legalRepBirthDate || null : null,
    legalRepBirthPlace: d.hasLegalRepresentative ? d.legalRepBirthPlace || null : null,
    legalRepResidence: d.hasLegalRepresentative ? d.legalRepResidence || null : null,
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
      forfaitPeriodicity: d.forfaitPeriodicity ?? null,
      forfaitNote: d.forfaitNote || null,
      notes: d.notes || null,
      address: d.address || null,
      vatNumber: d.vatNumber || null,
      taxCode: d.taxCode || null,
      sdiCode: d.sdiCode || null,
      pec: d.pec || null,
      email: d.email || null,
      phone: d.phone || null,
      hasLegalRepresentative: d.hasLegalRepresentative,
      legalRepFirstName: d.hasLegalRepresentative ? d.legalRepFirstName || null : null,
      legalRepLastName: d.hasLegalRepresentative ? d.legalRepLastName || null : null,
      legalRepBirthDate: d.hasLegalRepresentative ? d.legalRepBirthDate || null : null,
      legalRepBirthPlace: d.hasLegalRepresentative ? d.legalRepBirthPlace || null : null,
      legalRepResidence: d.hasLegalRepresentative ? d.legalRepResidence || null : null,
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
