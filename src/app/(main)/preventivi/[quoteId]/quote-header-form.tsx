"use client";

import { useActionState } from "react";
import { updateQuoteHeader, type QuoteFormState } from "@/app/actions/quote-actions";
import type { Client, Quote, QuoteEntity } from "@/db/schema";

export function QuoteHeaderForm({
  quote,
  clients,
  entities,
}: {
  quote: Quote;
  clients: Client[];
  entities: QuoteEntity[];
}) {
  const [state, formAction, pending] = useActionState<QuoteFormState | undefined, FormData>(
    updateQuoteHeader,
    undefined
  );

  return (
    <form action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-6">
      <input type="hidden" name="quoteId" value={quote.id} />
      <div className="sm:col-span-3">
        <label className="block text-xs font-medium text-slate-600">Entità emittente</label>
        <select
          name="entityId"
          defaultValue={quote.entityId}
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
        <label className="block text-xs font-medium text-slate-600">Cliente in anagrafica (facoltativo)</label>
        <select
          name="clientId"
          defaultValue={quote.clientId ?? ""}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        >
          <option value="">— Nessuno —</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="sm:col-span-3">
        <label className="block text-xs font-medium text-slate-600">Nome destinatario</label>
        <input
          type="text"
          name="recipientName"
          required
          defaultValue={quote.recipientName}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>
      <div className="sm:col-span-3">
        <label className="block text-xs font-medium text-slate-600">Indirizzo destinatario</label>
        <input
          type="text"
          name="recipientAddress"
          defaultValue={quote.recipientAddress ?? ""}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>

      <div className="sm:col-span-2">
        <label className="block text-xs font-medium text-slate-600">Data preventivo</label>
        <input
          type="date"
          name="quoteDate"
          required
          defaultValue={quote.quoteDate}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>
      <div className="sm:col-span-4">
        <label className="block text-xs font-medium text-slate-600">Oggetto (facoltativo)</label>
        <input
          type="text"
          name="title"
          defaultValue={quote.title ?? ""}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>

      {quote.pricingMode === "FLAT" && (
        <div className="sm:col-span-3 rounded-md bg-amber-50 p-3">
          <label className="block text-xs font-medium text-slate-600">Totale annuo (importo unico)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            name="flatAnnualAmount"
            defaultValue={quote.flatAnnualAmount ?? undefined}
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
          <p className="mt-1 text-xs text-slate-500">
            Questa famiglia usa un pacchetto forfettario onnicomprensivo: il trimestrale si calcola
            automaticamente (totale annuo / 4).
          </p>
        </div>
      )}

      <div className="sm:col-span-6">
        <label className="block text-xs font-medium text-slate-600">Note interne (facoltative)</label>
        <textarea
          name="notes"
          rows={2}
          defaultValue={quote.notes ?? ""}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>

      {state?.error && <p className="sm:col-span-6 text-sm text-red-600">{state.error}</p>}
      <div className="sm:col-span-6">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {pending ? "Salvataggio…" : "Salva dati preventivo"}
        </button>
      </div>
    </form>
  );
}
