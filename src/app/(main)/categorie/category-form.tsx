"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createCategory, renameCategory, type CategoryFormState } from "@/app/actions/category-actions";

export function NewCategoryForm() {
  const [state, formAction, pending] = useActionState<CategoryFormState | undefined, FormData>(
    createCategory,
    undefined
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-2">
      <div>
        <label className="block text-xs font-medium text-slate-600">Nuova macrocategoria</label>
        <input
          type="text"
          name="name"
          required
          placeholder="Es. Prima nota, Bilancio, Pratiche…"
          className="mt-1 w-64 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {pending ? "…" : "+ Aggiungi"}
      </button>
      {state?.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
    </form>
  );
}

export function RenameCategoryForm({
  categoryId,
  currentName,
  onDone,
}: {
  categoryId: string;
  currentName: string;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState<CategoryFormState | undefined, FormData>(
    renameCategory,
    undefined
  );
  const [handledState, setHandledState] = useState<CategoryFormState | undefined>(undefined);

  if (state && state !== handledState) {
    setHandledState(state);
    if (state.success) {
      onDone();
    }
  }

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="categoryId" value={categoryId} />
      <input
        type="text"
        name="name"
        defaultValue={currentName}
        required
        className="rounded-md border border-slate-300 px-2 py-1 text-sm"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-slate-900 px-2 py-1 text-xs text-white hover:bg-slate-800"
      >
        Salva
      </button>
      <button
        type="button"
        onClick={onDone}
        className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600"
      >
        Annulla
      </button>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
