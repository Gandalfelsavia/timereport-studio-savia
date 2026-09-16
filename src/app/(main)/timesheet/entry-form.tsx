"use client";

import { useActionState, useEffect, useRef } from "react";
import { createTimeEntry, updateTimeEntry, type TimesheetFormState } from "@/app/actions/timesheet-actions";

type ClientOption = { id: string; name: string };
type CategoryOption = { id: string; name: string };

export function NewEntryForm({
  clients,
  categories,
}: {
  clients: ClientOption[];
  categories: CategoryOption[];
}) {
  const [state, formAction, pending] = useActionState<TimesheetFormState | undefined, FormData>(
    createTimeEntry,
    undefined
  );
  const formRef = useRef<HTMLFormElement>(null);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-7">
      <div className="sm:col-span-1">
        <label className="block text-xs font-medium text-slate-600">Data</label>
        <input
          type="date"
          name="date"
          defaultValue={today}
          required
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-xs font-medium text-slate-600">Cliente</label>
        <select
          name="clientId"
          required
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          defaultValue=""
        >
          <option value="" disabled>
            Seleziona cliente…
          </option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-1">
        <label className="block text-xs font-medium text-slate-600">Macrocategoria</label>
        <select
          name="categoryId"
          required
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          defaultValue=""
        >
          <option value="" disabled>
            Scegli…
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className="block text-xs font-medium text-slate-600">Note</label>
        <input
          type="text"
          name="description"
          required
          placeholder="Es. Predisposizione F24…"
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>
      <div className="sm:col-span-1">
        <label className="block text-xs font-medium text-slate-600">Ore</label>
        <input
          type="number"
          name="hours"
          step="0.25"
          min="0.25"
          max="24"
          required
          placeholder="1.5"
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>
      <div className="flex items-end gap-2 sm:col-span-7">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" name="billable" defaultChecked className="h-4 w-4 rounded border-slate-300" />
          Da fatturare extra (deseleziona se inclusa nel forfait)
        </label>
        <button
          type="submit"
          disabled={pending}
          className="ml-auto rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {pending ? "Salvataggio…" : "Aggiungi attività"}
        </button>
      </div>
      {state?.error && <p className="sm:col-span-7 text-sm text-red-600">{state.error}</p>}
    </form>
  );
}

export function EditEntryForm({
  entry,
  clients,
  categories,
  onDone,
}: {
  entry: {
    id: string;
    date: string;
    clientId: string;
    categoryId: string;
    description: string;
    hours: number;
    billable: boolean;
  };
  clients: ClientOption[];
  categories: CategoryOption[];
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState<TimesheetFormState | undefined, FormData>(
    updateTimeEntry,
    undefined
  );

  useEffect(() => {
    if (state?.success) onDone();
  }, [state, onDone]);

  return (
    <form action={formAction} className="grid grid-cols-1 gap-2 rounded-md bg-slate-50 p-3 sm:grid-cols-7">
      <input type="hidden" name="entryId" value={entry.id} />
      <input
        type="date"
        name="date"
        defaultValue={entry.date}
        required
        className="rounded-md border border-slate-300 px-2 py-1.5 text-sm sm:col-span-1"
      />
      <select
        name="clientId"
        defaultValue={entry.clientId}
        required
        className="rounded-md border border-slate-300 px-2 py-1.5 text-sm sm:col-span-2"
      >
        {clients.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <select
        name="categoryId"
        defaultValue={entry.categoryId}
        required
        className="rounded-md border border-slate-300 px-2 py-1.5 text-sm sm:col-span-1"
      >
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <input
        type="text"
        name="description"
        defaultValue={entry.description}
        required
        className="rounded-md border border-slate-300 px-2 py-1.5 text-sm sm:col-span-2"
      />
      <input
        type="number"
        name="hours"
        step="0.25"
        min="0.25"
        max="24"
        defaultValue={entry.hours}
        required
        className="rounded-md border border-slate-300 px-2 py-1.5 text-sm sm:col-span-1"
      />
      <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-5">
        <input
          type="checkbox"
          name="billable"
          defaultChecked={entry.billable}
          className="h-4 w-4 rounded border-slate-300"
        />
        Da fatturare extra
      </label>
      <div className="flex gap-2 sm:col-span-2 sm:justify-end">
        <button
          type="button"
          onClick={onDone}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-white"
        >
          Annulla
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          Salva
        </button>
      </div>
      {state?.error && <p className="sm:col-span-7 text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
