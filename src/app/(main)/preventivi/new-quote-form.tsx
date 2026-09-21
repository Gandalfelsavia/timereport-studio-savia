"use client";

import { useActionState, useState } from "react";
import { createQuote, type QuoteFormState } from "@/app/actions/quote-actions";
import { quoteFamilyLabels } from "@/lib/quote-templates";
import type { Client, QuoteEntity } from "@/db/schema";

const families = Object.keys(quoteFamilyLabels) as Array<keyof typeof quoteFamilyLabels>;

export function NewQuoteForm({ clients, entities }: { clients: Client[]; entities: QuoteEntity[] }) {
  const [state, formAction, pending] = useActionState<QuoteFormState | undefined, FormData>(
    createQuote,
    undefined
  );
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState("");

  const selectedClient = clients.find((c) => c.id === clientId);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
      >
        + Nuovo preventivo
      </button>
    );
  }

  return (
    <form action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-6">
      <div className="sm:col-span-3">
        <label className="block text-xs font-medium text-slate-600">Entità emittente</label>
        <select
          name="entityId"
          required
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        >
          {entities.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-3">
        <label className="block text-xs font-medium text-slate-600">Famiglia preventivo</label>
        <select name="family" required className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm">
          {families.map((f) => (
            <option key={f} value={f}>
              {quoteFamilyLabels[f]}
            </option>
          ))}
        </select>
      </div>

      <div className="sm:col-span-3">
        <label className="block text-xs font-medium text-slate-600">Cliente in anagrafica (facoltativo)</label>
        <select
          name="clientId"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        >
          <option value="">— Nessuno (destinatario non ancora censito) —</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-3">
        <label className="block text-xs font-medium text-slate-600">Data preventivo</label>
        <input
          type="date"
          name="quoteDate"
          required
          defaultValue={new Date().toISOString().slice(0, 10)}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>

      <div className="sm:col-span-3">
        <label className="block text-xs font-medium text-slate-600">Nome destinatario (Spett.le)</label>
        <input
          type="text"
          name="recipientName"
          required
          defaultValue={selectedClient?.name ?? ""}
          key={clientId}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>
      <div className="sm:col-span-3">
        <label className="block text-xs font-medium text-slate-600">Indirizzo destinatario</label>
        <input
          type="text"
          name="recipientAddress"
          defaultValue={selectedClient?.address ?? ""}
          key={`addr-${clientId}`}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>

      <div className="sm:col-span-6">
        <label className="block text-xs font-medium text-slate-600">Oggetto (facoltativo)</label>
        <input
          type="text"
          name="title"
          placeholder="Es. Preventivo per costituzione e gestione SRL"
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>

      {state?.error && <p className="sm:col-span-6 text-sm text-red-600">{state.error}</p>}
      <div className="flex gap-2 sm:col-span-6 sm:justify-end">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-white"
        >
          Annulla
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {pending ? "Creazione…" : "Crea e apri preventivo"}
        </button>
      </div>
    </form>
  );
}
