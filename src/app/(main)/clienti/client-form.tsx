"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createClient, updateClient, type ClientFormState } from "@/app/actions/client-actions";
import type { Client } from "@/db/schema";

export function NewClientForm() {
  const [state, formAction, pending] = useActionState<ClientFormState | undefined, FormData>(
    createClient,
    undefined
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [handledState, setHandledState] = useState<ClientFormState | undefined>(undefined);

  if (state && state !== handledState) {
    setHandledState(state);
    if (state.success && open) {
      setOpen(false);
    }
  }

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
      >
        + Nuovo cliente
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <ClientFields formAction={formAction} pending={pending} error={state?.error} formRef={formRef} onCancel={() => setOpen(false)} />
    </div>
  );
}

export function EditClientForm({ client, onDone }: { client: Client; onDone: () => void }) {
  const [state, formAction, pending] = useActionState<ClientFormState | undefined, FormData>(
    updateClient,
    undefined
  );

  useEffect(() => {
    if (state?.success) onDone();
  }, [state, onDone]);

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <ClientFields
        formAction={formAction}
        pending={pending}
        error={state?.error}
        onCancel={onDone}
        defaultValues={client}
        hiddenClientId={client.id}
      />
    </div>
  );
}

function ClientFields({
  formAction,
  pending,
  error,
  formRef,
  onCancel,
  defaultValues,
  hiddenClientId,
}: {
  formAction: (formData: FormData) => void;
  pending: boolean;
  error?: string;
  formRef?: React.RefObject<HTMLFormElement | null>;
  onCancel: () => void;
  defaultValues?: Client;
  hiddenClientId?: string;
}) {
  const [billingType, setBillingType] = useState(defaultValues?.billingType ?? "HOURLY");
  const [hasLegalRep, setHasLegalRep] = useState(defaultValues?.hasLegalRepresentative ?? false);

  return (
    <form ref={formRef} action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-6">
      {hiddenClientId && <input type="hidden" name="clientId" value={hiddenClientId} />}
      <div className="sm:col-span-2">
        <label className="block text-xs font-medium text-slate-600">Nome cliente</label>
        <input
          type="text"
          name="name"
          required
          defaultValue={defaultValues?.name}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-xs font-medium text-slate-600">Tipo fatturazione</label>
        <select
          name="billingType"
          value={billingType}
          onChange={(e) => setBillingType(e.target.value as typeof billingType)}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        >
          <option value="HOURLY">A tariffa oraria</option>
          <option value="FORFAIT">Forfait</option>
          <option value="MIXED">Misto (forfait + extra a ore)</option>
        </select>
      </div>
      {(billingType === "HOURLY" || billingType === "MIXED") && (
        <div className="sm:col-span-1">
          <label className="block text-xs font-medium text-slate-600">Tariffa oraria (€)</label>
          <input
            type="number"
            name="hourlyRate"
            step="0.01"
            min="0"
            defaultValue={defaultValues?.hourlyRate ?? undefined}
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
        </div>
      )}
      {(billingType === "FORFAIT" || billingType === "MIXED") && (
        <div className="sm:col-span-1">
          <label className="block text-xs font-medium text-slate-600">Forfait periodico (€)</label>
          <input
            type="number"
            name="forfaitAmount"
            step="0.01"
            min="0"
            defaultValue={defaultValues?.forfaitAmount ?? undefined}
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
        </div>
      )}
      {(billingType === "FORFAIT" || billingType === "MIXED") && (
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-slate-600">Note forfait</label>
          <input
            type="text"
            name="forfaitNote"
            placeholder="Es. mensile, adempimenti ordinari…"
            defaultValue={defaultValues?.forfaitNote ?? undefined}
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
        </div>
      )}
      <div className="sm:col-span-6 border-t border-slate-200 pt-3">
        <p className="mb-2 text-xs font-semibold uppercase text-slate-500">
          Dati anagrafici e di contatto (facoltativi)
        </p>
      </div>
      <div className="sm:col-span-3">
        <label className="block text-xs font-medium text-slate-600">Indirizzo</label>
        <input
          type="text"
          name="address"
          defaultValue={defaultValues?.address ?? undefined}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>
      <div className="sm:col-span-1">
        <label className="block text-xs font-medium text-slate-600">Partita IVA</label>
        <input
          type="text"
          name="vatNumber"
          defaultValue={defaultValues?.vatNumber ?? undefined}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>
      <div className="sm:col-span-1">
        <label className="block text-xs font-medium text-slate-600">Codice Fiscale</label>
        <input
          type="text"
          name="taxCode"
          defaultValue={defaultValues?.taxCode ?? undefined}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>
      <div className="sm:col-span-1">
        <label className="block text-xs font-medium text-slate-600">Codice SDI</label>
        <input
          type="text"
          name="sdiCode"
          defaultValue={defaultValues?.sdiCode ?? undefined}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-xs font-medium text-slate-600">PEC</label>
        <input
          type="email"
          name="pec"
          defaultValue={defaultValues?.pec ?? undefined}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-xs font-medium text-slate-600">Email</label>
        <input
          type="email"
          name="email"
          defaultValue={defaultValues?.email ?? undefined}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-xs font-medium text-slate-600">Telefono</label>
        <input
          type="tel"
          name="phone"
          defaultValue={defaultValues?.phone ?? undefined}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>

      <div className="sm:col-span-6">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="hasLegalRepresentative"
            checked={hasLegalRep}
            onChange={(e) => setHasLegalRep(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
          Il cliente ha un legale rappresentante (non serve, ad es., per le ditte individuali)
        </label>
      </div>

      {hasLegalRep && (
        <div className="grid grid-cols-1 gap-3 rounded-md bg-slate-50 p-3 sm:col-span-6 sm:grid-cols-6">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-600">Nome</label>
            <input
              type="text"
              name="legalRepFirstName"
              defaultValue={defaultValues?.legalRepFirstName ?? undefined}
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-600">Cognome</label>
            <input
              type="text"
              name="legalRepLastName"
              defaultValue={defaultValues?.legalRepLastName ?? undefined}
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-600">Nato il</label>
            <input
              type="date"
              name="legalRepBirthDate"
              defaultValue={defaultValues?.legalRepBirthDate ?? undefined}
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div className="sm:col-span-3">
            <label className="block text-xs font-medium text-slate-600">Luogo di nascita</label>
            <input
              type="text"
              name="legalRepBirthPlace"
              defaultValue={defaultValues?.legalRepBirthPlace ?? undefined}
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div className="sm:col-span-3">
            <label className="block text-xs font-medium text-slate-600">Residenza</label>
            <input
              type="text"
              name="legalRepResidence"
              defaultValue={defaultValues?.legalRepResidence ?? undefined}
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>
        </div>
      )}

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
          {pending ? "Salvataggio…" : "Salva cliente"}
        </button>
      </div>
    </form>
  );
}
