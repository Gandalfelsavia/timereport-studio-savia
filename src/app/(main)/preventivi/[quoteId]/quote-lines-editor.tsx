"use client";

import { useActionState, useRef, useState } from "react";
import {
  addQuoteLine,
  updateQuoteLine,
  deleteQuoteLine,
  type QuoteFormState,
} from "@/app/actions/quote-actions";
import { periodicityLabels, tariffSourceLabels } from "@/lib/quotes";
import { formatCurrency } from "@/lib/format";
import type { FeeScheduleItem, QuoteLine } from "@/db/schema";

const periodicities = Object.keys(periodicityLabels) as QuoteLine["periodicity"][];
const tariffSources = Object.keys(tariffSourceLabels) as QuoteLine["tariffSource"][];

function feeAmountFor(item: FeeScheduleItem | undefined, source: QuoteLine["tariffSource"]): number | null {
  if (!item) return null;
  if (source === "ANC") return item.ancAmount;
  if (source === "UNIONE_GIOVANI") return item.unioneGiovaniAmount;
  return null;
}

function LineFields({
  feeScheduleItems,
  defaultValues,
}: {
  feeScheduleItems: FeeScheduleItem[];
  defaultValues?: QuoteLine;
}) {
  const [tariffSource, setTariffSource] = useState<QuoteLine["tariffSource"]>(
    defaultValues?.tariffSource ?? "LIBERO"
  );
  const [feeScheduleItemId, setFeeScheduleItemId] = useState(defaultValues?.feeScheduleItemId ?? "");
  const amountRef = useRef<HTMLInputElement>(null);

  const categories = Array.from(new Set(feeScheduleItems.map((i) => i.category || "Altro")));

  function applyPrefill(nextSource: QuoteLine["tariffSource"], nextItemId: string) {
    const item = feeScheduleItems.find((i) => i.id === nextItemId);
    const suggested = feeAmountFor(item, nextSource);
    if (suggested != null && amountRef.current) {
      amountRef.current.value = String(suggested);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-12">
      <div className="sm:col-span-5">
        <label className="block text-xs font-medium text-slate-600">Descrizione</label>
        <input
          type="text"
          name="description"
          required
          defaultValue={defaultValues?.description}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>
      <div className="sm:col-span-3">
        <label className="block text-xs font-medium text-slate-600">Fonte tariffa</label>
        <select
          name="tariffSource"
          value={tariffSource}
          onChange={(e) => {
            const next = e.target.value as QuoteLine["tariffSource"];
            setTariffSource(next);
            applyPrefill(next, feeScheduleItemId);
          }}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        >
          {tariffSources.map((s) => (
            <option key={s} value={s}>
              {tariffSourceLabels[s]}
            </option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className="block text-xs font-medium text-slate-600">Importo (€)</label>
        <input
          ref={amountRef}
          type="number"
          step="0.01"
          min="0"
          name="amount"
          defaultValue={defaultValues?.amount ?? undefined}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-xs font-medium text-slate-600">Periodicità</label>
        <select
          name="periodicity"
          defaultValue={defaultValues?.periodicity ?? "UNA_TANTUM"}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        >
          {periodicities.map((p) => (
            <option key={p} value={p}>
              {periodicityLabels[p]}
            </option>
          ))}
        </select>
      </div>

      {tariffSource !== "LIBERO" && (
        <div className="sm:col-span-7">
          <label className="block text-xs font-medium text-slate-600">
            Voce di riferimento {tariffSourceLabels[tariffSource]} (precompila l&apos;importo)
          </label>
          <select
            name="feeScheduleItemId"
            value={feeScheduleItemId}
            onChange={(e) => {
              setFeeScheduleItemId(e.target.value);
              applyPrefill(tariffSource, e.target.value);
            }}
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          >
            <option value="">— Nessuna (importo libero) —</option>
            {categories.map((cat) => (
              <optgroup key={cat} label={cat}>
                {feeScheduleItems
                  .filter((i) => (i.category || "Altro") === cat)
                  .map((i) => {
                    const amount = feeAmountFor(i, tariffSource);
                    return (
                      <option key={i.id} value={i.id}>
                        {i.label}
                        {amount != null ? ` — ${formatCurrency(amount)}` : " — vedi nota"}
                      </option>
                    );
                  })}
              </optgroup>
            ))}
          </select>
        </div>
      )}

      <div className="sm:col-span-12">
        <label className="block text-xs font-medium text-slate-600">Dettaglio/nota (facoltativo)</label>
        <textarea
          name="detail"
          rows={2}
          defaultValue={defaultValues?.detail ?? ""}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>
    </div>
  );
}

function EditLineRow({
  line,
  feeScheduleItems,
  onDone,
}: {
  line: QuoteLine;
  feeScheduleItems: FeeScheduleItem[];
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState<QuoteFormState | undefined, FormData>(
    updateQuoteLine,
    undefined
  );

  if (state?.success) onDone();

  return (
    <form action={formAction} className="rounded-md bg-slate-50 p-3">
      <input type="hidden" name="lineId" value={line.id} />
      <input type="hidden" name="quoteId" value={line.quoteId} />
      <LineFields feeScheduleItems={feeScheduleItems} defaultValues={line} />
      {state?.error && <p className="mt-2 text-sm text-red-600">{state.error}</p>}
      <div className="mt-2 flex justify-end gap-2">
        <button
          type="button"
          onClick={onDone}
          className="rounded-md border border-slate-300 px-3 py-1 text-xs text-slate-600 hover:bg-white"
        >
          Annulla
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-slate-900 px-3 py-1 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {pending ? "Salvataggio…" : "Salva riga"}
        </button>
      </div>
    </form>
  );
}

export function QuoteLinesEditor({
  quoteId,
  lines,
  feeScheduleItems,
  pricingMode,
}: {
  quoteId: string;
  lines: QuoteLine[];
  feeScheduleItems: FeeScheduleItem[];
  pricingMode: "ITEMIZED" | "FLAT";
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [addState, addFormAction, addPending] = useActionState<QuoteFormState | undefined, FormData>(
    addQuoteLine,
    undefined
  );

  if (addState?.success && adding) setAdding(false);

  return (
    <div className="space-y-2">
      {lines.length === 0 && <p className="text-sm text-slate-500">Nessuna riga ancora inserita.</p>}
      {lines.map((line) =>
        editingId === line.id ? (
          <EditLineRow key={line.id} line={line} feeScheduleItems={feeScheduleItems} onDone={() => setEditingId(null)} />
        ) : (
          <div
            key={line.id}
            className="flex flex-wrap items-center gap-3 rounded-md border border-slate-200 px-3 py-2 text-sm"
          >
            <span className="flex-1 min-w-[200px] text-slate-800">{line.description}</span>
            {pricingMode === "ITEMIZED" && (
              <>
                <span className="w-24 shrink-0 text-slate-500">{periodicityLabels[line.periodicity]}</span>
                <span className="w-28 shrink-0 text-right font-medium text-slate-700">
                  {line.amount != null ? formatCurrency(line.amount) : "da stimare"}
                </span>
              </>
            )}
            <span className="w-24 shrink-0 text-xs text-slate-400">{tariffSourceLabels[line.tariffSource]}</span>
            <div className="ml-auto flex shrink-0 gap-2">
              <button
                onClick={() => setEditingId(line.id)}
                className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
              >
                Modifica
              </button>
              <button
                onClick={() => deleteQuoteLine(line.id, quoteId)}
                className="rounded-md border border-slate-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
              >
                Elimina
              </button>
            </div>
          </div>
        )
      )}

      {adding ? (
        <form action={addFormAction} className="rounded-md bg-slate-50 p-3">
          <input type="hidden" name="quoteId" value={quoteId} />
          <LineFields feeScheduleItems={feeScheduleItems} />
          {addState?.error && <p className="mt-2 text-sm text-red-600">{addState.error}</p>}
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="rounded-md border border-slate-300 px-3 py-1 text-xs text-slate-600 hover:bg-white"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={addPending}
              className="rounded-md bg-slate-900 px-3 py-1 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {addPending ? "Aggiunta…" : "Aggiungi riga"}
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
        >
          + Aggiungi riga
        </button>
      )}
    </div>
  );
}
