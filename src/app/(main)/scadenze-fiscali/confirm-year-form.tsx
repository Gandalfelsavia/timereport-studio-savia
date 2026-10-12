"use client";

import { useActionState, useEffect, useState } from "react";
import {
  confirmFiscalDeadlineYear,
  type FiscalDeadlineFormState,
} from "@/app/actions/fiscal-deadline-actions";

// Form inline usato nel banner "da verificare": conferma (o corregge) la
// data di una scadenza per l'anno corrente. Salvare qui non richiede alcun
// deploy: il valore finisce in fiscal_deadline_yearly_values e da quel
// momento compare come data definitiva nel calendario.
export function ConfirmYearForm({
  deadlineId,
  year,
  suggestedDate,
  onDone,
}: {
  deadlineId: string;
  year: number;
  suggestedDate?: string;
  onDone?: () => void;
}) {
  const [state, formAction, pending] = useActionState<FiscalDeadlineFormState | undefined, FormData>(
    confirmFiscalDeadlineYear,
    undefined
  );
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (state?.success) {
      setOpen(false);
      onDone?.();
    }
  }, [state, onDone]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-amber-400 bg-white px-2.5 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50"
      >
        Conferma data {year}
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2 rounded-md bg-white p-2">
      <input type="hidden" name="deadlineId" value={deadlineId} />
      <input type="hidden" name="year" value={year} />
      <div>
        <label className="block text-[11px] font-medium text-slate-600">Data scadenza {year}</label>
        <input
          type="date"
          name="date"
          required
          defaultValue={suggestedDate}
          className="mt-1 rounded-md border border-slate-300 px-2 py-1 text-sm"
        />
      </div>
      <div>
        <label className="block text-[11px] font-medium text-slate-600">Nota (facoltativa)</label>
        <input
          type="text"
          name="note"
          placeholder="Es. da circolare INPS n…"
          className="mt-1 rounded-md border border-slate-300 px-2 py-1 text-sm"
        />
      </div>
      {state?.error && <p className="w-full text-xs text-red-600">{state.error}</p>}
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md border border-slate-300 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50"
        >
          Annulla
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-slate-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {pending ? "Salvataggio…" : "Salva"}
        </button>
      </div>
    </form>
  );
}
