"use client";

import { useActionState, useEffect, useState } from "react";
import {
  createFiscalDeadline,
  updateFiscalDeadline,
  type FiscalDeadlineFormState,
} from "@/app/actions/fiscal-deadline-actions";
import { deadlineCategoryLabels, deadlineRuleTypeLabels } from "@/lib/fiscal-deadlines";
import type { FiscalDeadline } from "@/db/schema";

export function NewDeadlineForm({ onDone }: { onDone: () => void }) {
  const [state, formAction, pending] = useActionState<FiscalDeadlineFormState | undefined, FormData>(
    createFiscalDeadline,
    undefined
  );

  useEffect(() => {
    if (state?.success) onDone();
  }, [state, onDone]);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <DeadlineFields formAction={formAction} pending={pending} error={state?.error} onCancel={onDone} />
    </div>
  );
}

export function EditDeadlineForm({ deadline, onDone }: { deadline: FiscalDeadline; onDone: () => void }) {
  const [state, formAction, pending] = useActionState<FiscalDeadlineFormState | undefined, FormData>(
    updateFiscalDeadline,
    undefined
  );

  useEffect(() => {
    if (state?.success) onDone();
  }, [state, onDone]);

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <DeadlineFields
        formAction={formAction}
        pending={pending}
        error={state?.error}
        onCancel={onDone}
        defaultValues={deadline}
        hiddenDeadlineId={deadline.id}
      />
    </div>
  );
}

function DeadlineFields({
  formAction,
  pending,
  error,
  onCancel,
  defaultValues,
  hiddenDeadlineId,
}: {
  formAction: (formData: FormData) => void;
  pending: boolean;
  error?: string;
  onCancel: () => void;
  defaultValues?: FiscalDeadline;
  hiddenDeadlineId?: string;
}) {
  const [ruleType, setRuleType] = useState(defaultValues?.ruleType ?? "ANNUAL_DATE");

  return (
    <form action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-6">
      {hiddenDeadlineId && <input type="hidden" name="deadlineId" value={hiddenDeadlineId} />}
      <div className="sm:col-span-4">
        <label className="block text-xs font-medium text-slate-600">Titolo</label>
        <input
          type="text"
          name="title"
          required
          defaultValue={defaultValues?.title}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-xs font-medium text-slate-600">Categoria</label>
        <select
          name="category"
          defaultValue={defaultValues?.category ?? "FISCALE"}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        >
          {Object.entries(deadlineCategoryLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-3">
        <label className="block text-xs font-medium text-slate-600">Fonte / Ente</label>
        <input
          type="text"
          name="source"
          required
          placeholder="Es. Agenzia delle Entrate"
          defaultValue={defaultValues?.source}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>
      <div className="sm:col-span-3">
        <label className="block text-xs font-medium text-slate-600">Tipo di regola</label>
        <select
          name="ruleType"
          value={ruleType}
          onChange={(e) => setRuleType(e.target.value as typeof ruleType)}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        >
          {Object.entries(deadlineRuleTypeLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {(ruleType === "MONTHLY_DAY" || ruleType === "ANNUAL_DATE") && (
        <div className="sm:col-span-1">
          <label className="block text-xs font-medium text-slate-600">Giorno</label>
          <input
            type="number"
            name="ruleDay"
            min="1"
            max="31"
            required
            defaultValue={defaultValues?.ruleDay ?? undefined}
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
        </div>
      )}
      {ruleType === "ANNUAL_DATE" && (
        <div className="sm:col-span-1">
          <label className="block text-xs font-medium text-slate-600">Mese</label>
          <input
            type="number"
            name="ruleMonth"
            min="1"
            max="12"
            required
            defaultValue={defaultValues?.ruleMonth ?? undefined}
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
        </div>
      )}
      {ruleType === "DAYS_AFTER_YEAR_END" && (
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-slate-600">Giorni dalla chiusura (31/12)</label>
          <input
            type="number"
            name="ruleDaysAfterYearEnd"
            min="1"
            max="365"
            required
            defaultValue={defaultValues?.ruleDaysAfterYearEnd ?? undefined}
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
        </div>
      )}
      {ruleType === "MANUAL_YEARLY" && (
        <div className="sm:col-span-6">
          <p className="text-[11px] text-slate-500">
            Nessuna regola fissa: la data va confermata ogni anno dal banner &quot;da verificare&quot; in cima alla
            pagina.
          </p>
        </div>
      )}

      <div className="sm:col-span-3">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="augustSuspension"
            defaultChecked={defaultValues?.augustSuspension ?? false}
            className="h-4 w-4 rounded border-slate-300"
          />
          Soggetta a sospensione feriale (1-20 agosto)
        </label>
      </div>
      <div className="sm:col-span-3">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="needsReview"
            defaultChecked={defaultValues?.needsReview ?? false}
            className="h-4 w-4 rounded border-slate-300"
          />
          Da verificare ogni anno (regola non del tutto certa)
        </label>
      </div>

      <div className="sm:col-span-6">
        <label className="block text-xs font-medium text-slate-600">Note</label>
        <textarea
          name="notes"
          rows={2}
          defaultValue={defaultValues?.notes ?? undefined}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>

      {error && <p className="sm:col-span-6 text-sm text-red-600">{error}</p>}
      <div className="flex gap-2 sm:col-span-6 sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-white"
        >
          Annulla
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {pending ? "Salvataggio…" : "Salva scadenza"}
        </button>
      </div>
    </form>
  );
}
