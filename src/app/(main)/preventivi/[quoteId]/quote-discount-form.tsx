"use client";

import { useState } from "react";
import { updateQuoteDiscount } from "@/app/actions/quote-actions";
import { parseDiscountLineIds } from "@/lib/quotes";
import { formatCurrency } from "@/lib/format";
import type { Quote, QuoteLine } from "@/db/schema";

export function QuoteDiscountForm({ quote, lines }: { quote: Quote; lines: QuoteLine[] }) {
  const [enabled, setEnabled] = useState(quote.discountEnabled);
  const selectedIds = parseDiscountLineIds(quote.discountLineIds);
  const applicableLines = lines.filter((l) => l.periodicity !== "UNA_TANTUM");

  async function handleSubmit(formData: FormData) {
    await updateQuoteDiscount(formData);
  }

  return (
    <form action={handleSubmit} className="space-y-3">
      <input type="hidden" name="quoteId" value={quote.id} />
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          name="discountEnabled"
          value="true"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300"
        />
        Applica uno sconto a questo preventivo
      </label>

      {enabled && (
        <div className="grid grid-cols-1 gap-3 rounded-md bg-slate-50 p-3 sm:grid-cols-6">
          <div className="sm:col-span-4">
            <label className="block text-xs font-medium text-slate-600">Etichetta (es. &quot;Sconto 20% primo anno&quot;)</label>
            <input
              type="text"
              name="discountLabel"
              defaultValue={quote.discountLabel ?? ""}
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div className="sm:col-span-1">
            <label className="block text-xs font-medium text-slate-600">Tipo</label>
            <select
              name="discountKind"
              defaultValue={quote.discountKind ?? "PERCENT"}
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            >
              <option value="PERCENT">%</option>
              <option value="AMOUNT">€</option>
            </select>
          </div>
          <div className="sm:col-span-1">
            <label className="block text-xs font-medium text-slate-600">Valore</label>
            <input
              type="number"
              step="0.01"
              min="0"
              name="discountValue"
              defaultValue={quote.discountValue ?? undefined}
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>

          {quote.pricingMode === "ITEMIZED" && (
            <div className="sm:col-span-6">
              <p className="mb-1 text-xs font-medium text-slate-600">
                Applica solo a queste righe (lascia tutto deselezionato per applicarlo all&apos;intero totale)
              </p>
              <div className="space-y-1">
                {applicableLines.map((l) => (
                  <label key={l.id} className="flex items-center gap-2 text-xs text-slate-600">
                    <input
                      type="checkbox"
                      name="discountLineIds"
                      value={l.id}
                      defaultChecked={selectedIds.includes(l.id)}
                      className="h-3.5 w-3.5 rounded border-slate-300"
                    />
                    {l.description} {l.amount != null ? `(${formatCurrency(l.amount)})` : ""}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <button
        type="submit"
        className="rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
      >
        Salva sconto
      </button>
    </form>
  );
}
