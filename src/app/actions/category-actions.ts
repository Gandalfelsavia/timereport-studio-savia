"use server";

import { auth } from "@/auth";
import { db, activityCategories } from "@/db";
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

const categorySchema = z.object({
  name: z.string().min(1, "Il nome della categoria è obbligatorio").max(100),
});

export type CategoryFormState = { error?: string; success?: boolean };

export async function createCategory(
  _prevState: CategoryFormState | undefined,
  formData: FormData
): Promise<CategoryFormState> {
  await requireAdminOrSupervisor();

  const parsed = categorySchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dati non validi." };
  }

  try {
    await db.insert(activityCategories).values({ name: parsed.data.name.trim() });
  } catch {
    return { error: "Esiste già una categoria con questo nome." };
  }

  revalidatePath("/categorie");
  revalidatePath("/timesheet");
  return { success: true };
}

export async function renameCategory(
  _prevState: CategoryFormState | undefined,
  formData: FormData
): Promise<CategoryFormState> {
  await requireAdminOrSupervisor();

  const categoryId = formData.get("categoryId") as string;
  const parsed = categorySchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dati non validi." };
  }

  try {
    await db
      .update(activityCategories)
      .set({ name: parsed.data.name.trim() })
      .where(eq(activityCategories.id, categoryId));
  } catch {
    return { error: "Esiste già una categoria con questo nome." };
  }

  revalidatePath("/categorie");
  revalidatePath("/timesheet");
  return { success: true };
}

export async function toggleCategoryActive(categoryId: string, active: boolean) {
  await requireAdminOrSupervisor();
  await db.update(activityCategories).set({ active }).where(eq(activityCategories.id, categoryId));
  revalidatePath("/categorie");
  revalidatePath("/timesheet");
}
