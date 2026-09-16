"use client";

import { useActionState, useEffect, useRef, useState } from "react";
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
  const [billable, setBillable] = useState(true);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      setBillable(true);
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
      <div className="sm:col-span-3">
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
        <label className="block text-xs font-medium text-slate-600">Dalle</label>
        <input
          type="time"
          name="startTime"
          required
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>
      <div className="sm:col-span-1">
        <label className="block text-xs font-medium text-slate-600">Alle</label>
        <input
          type="time"
          name="endTime"
          required
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>

      <div className="sm:col-span-7">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="billable"
            checked={billable}
            onChange={(e) => setBillable(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
          Da fatturare extra (deseleziona se inclusa nel forfait)
        </label>
      </div>

      {billable && (
        <div className="grid grid-cols-1 gap-3 rounded-md bg-slate-50 p-3 sm:col-span-7 sm:grid-cols-4">
          <div className="sm:col-span-1">
            <label className="block text-xs font-medium text-slate-600">
              Importo da fatturare (facoltativo)
            </label>
            <input
              type="number"
              name="billingAmount"
              step="0.01"
              min="0"
              placeholder="Auto: ore × tariffa"
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
            <p className="mt-0.5 text-[11px] text-slate-400">
              Se lo compili, sostituisce il calcolo ore × tariffa oraria per questa attività.
            </p>
          </div>
          <div className="sm:col-span-1">
            <label className="block text-xs font-medium text-slate-600">
              Costo sostenuto (facoltativo)
            </label>
            <input
              type="number"
              name="expenseAmount"
              step="0.01"
              min="0"
              placeholder="0,00"
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
            <p className="mt-0.5 text-[11px] text-slate-400">
              Spese vive da riaddebitare (bolli, diritti CCIAA, ecc.).
            </p>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-600">
              Descrizione costo sostenuto
            </label>
            <input
              type="text"
              name="expenseNote"
              placeholder="Es. Diritti di segreteria CCIAA"
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>
        </div>
      )}

      <div className="flex items-end sm:col-span-7">
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
    startTime: string | null;
    endTime: string | null;
    hours: number;
    billable: boolean;
    billingAmount: number | null;
    expenseAmount: number | null;
    expenseNote: string | null;
  };
  clients: ClientOption[];
  categories: CategoryOption[];
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState<TimesheetFormState | undefined, FormData>(
    updateTimeEntry,
    undefined
  );
  const [billable, setBillable] = useState(entry.billable);

  useEffect(() => {
    if (state?.success) onDone();
  }, [state, onDone]);

  // Le attività storiche potrebbero non avere un orario dalle-alle salvato:
  // in tal caso partiamo da un orario vuoto che l'utente dovrà completare.
  const startTime = entry.startTime?.slice(0, 5) ?? "";
  const endTime = entry.endTime?.slice(0, 5) ?? "";

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
        className="rounded-md border border-slate-300 px-2 py-1.5 text-sm sm:col-span-3"
      />
      <div className="sm:col-span-1">
        <label className="block text-[11px] font-medium text-slate-500">Dalle</label>
        <input
          type="time"
          name="startTime"
          defaultValue={startTime}
          required
          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>
      <div className="sm:col-span-1">
        <label className="block text-[11px] font-medium text-slate-500">Alle</label>
        <input
          type="time"
          name="endTime"
          defaultValue={endTime}
          required
          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>

      <div className="sm:col-span-7">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="billable"
            checked={billable}
            onChange={(e) => setBillable(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
          Da fatturare extra
        </label>
      </div>

      {billable && (
        <div className="grid grid-cols-1 gap-3 rounded-md bg-white p-3 sm:col-span-7 sm:grid-cols-4">
          <div className="sm:col-span-1">
            <label className="block text-xs font-medium text-slate-600">
              Importo da fatturare (facoltativo)
            </label>
            <input
              type="number"
              name="billingAmount"
              step="0.01"
              min="0"
              defaultValue={entry.billingAmount ?? ""}
              placeholder="Auto: ore × tariffa"
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div className="sm:col-span-1">
            <label className="block text-xs font-medium text-slate-600">
              Costo sostenuto (facoltativo)
            </label>
            <input
              type="number"
              name="expenseAmount"
              step="0.01"
              min="0"
              defaultValue={entry.expenseAmount ?? ""}
              placeholder="0,00"
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-600">
              Descrizione costo sostenuto
            </label>
            <input
              type="text"
              name="expenseNote"
              defaultValue={entry.expenseNote ?? ""}
              placeholder="Es. Diritti di segreteria CCIAA"
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>
        </div>
      )}

      <div className="flex gap-2 sm:col-span-7 sm:justify-end">
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
