"use server";

import { auth } from "@/auth";
import { db, users } from "@/db";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";

async function requireSupervisor() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPERVISOR") {
    throw new Error("Non autorizzato.");
  }
  return session;
}

const userSchema = z.object({
  name: z.string().min(1, "Il nome è obbligatorio"),
  email: z.string().email("Email non valida"),
  role: z.enum(["EMPLOYEE", "ADMIN", "SUPERVISOR"]),
  password: z.string().min(6, "La password deve avere almeno 6 caratteri").optional().or(z.literal("")),
  // Costo orario pieno per lo studio: usato solo nel report di redditività
  // per cliente, visibile e modificabile solo dal Supervisore.
  hourlyCost: z.string().optional(),
});

export type UserFormState = { error?: string; success?: boolean };

export async function createUser(
  _prevState: UserFormState | undefined,
  formData: FormData
): Promise<UserFormState> {
  await requireSupervisor();

  const parsed = userSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dati non validi." };
  }
  if (!parsed.data.password) {
    return { error: "La password è obbligatoria per un nuovo utente." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  try {
    await db.insert(users).values({
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase().trim(),
      role: parsed.data.role,
      passwordHash,
      hourlyCost: parsed.data.hourlyCost ? Number(parsed.data.hourlyCost) : null,
    });
  } catch {
    return { error: "Esiste già un utente con questa email." };
  }

  revalidatePath("/utenti");
  return { success: true };
}

const updateUserSchema = z.object({
  userId: z.string().uuid(),
  name: z.string().min(1, "Il nome è obbligatorio"),
  email: z.string().email("Email non valida"),
  role: z.enum(["EMPLOYEE", "ADMIN", "SUPERVISOR"]),
  hourlyCost: z.string().optional(),
});

export async function updateUser(
  _prevState: UserFormState | undefined,
  formData: FormData
): Promise<UserFormState> {
  await requireSupervisor();

  const parsed = updateUserSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dati non validi." };
  }
  const d = parsed.data;

  try {
    await db
      .update(users)
      .set({
        name: d.name,
        email: d.email.toLowerCase().trim(),
        role: d.role,
        hourlyCost: d.hourlyCost ? Number(d.hourlyCost) : null,
      })
      .where(eq(users.id, d.userId));
  } catch {
    return { error: "Esiste già un utente con questa email." };
  }

  revalidatePath("/utenti");
  return { success: true };
}

export async function toggleUserActive(userId: string, active: boolean) {
  await requireSupervisor();
  await db.update(users).set({ active }).where(eq(users.id, userId));
  revalidatePath("/utenti");
}

export async function resetUserPassword(
  _prevState: UserFormState | undefined,
  formData: FormData
): Promise<UserFormState> {
  await requireSupervisor();
  const userId = formData.get("userId") as string;
  const password = formData.get("password") as string;

  if (!password || password.length < 6) {
    return { error: "La password deve avere almeno 6 caratteri." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await db.update(users).set({ passwordHash }).where(eq(users.id, userId));

  revalidatePath("/utenti");
  return { success: true };
}
