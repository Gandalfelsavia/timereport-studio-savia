"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  createUser,
  updateUser,
  resetUserPassword,
  toggleUserActive,
  type UserFormState,
} from "@/app/actions/user-actions";
import type { User } from "@/db/schema";
import { roleLabels, formatCurrency } from "@/lib/format";

export function NewUserForm() {
  const [state, formAction, pending] = useActionState<UserFormState | undefined, FormData>(
    createUser,
    undefined
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [handledState, setHandledState] = useState<UserFormState | undefined>(undefined);

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
        + Nuovo utente
      </button>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-6">
      <div className="sm:col-span-1">
        <label className="block text-xs font-medium text-slate-600">Nome</label>
        <input name="name" required className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      </div>
      <div className="sm:col-span-1">
        <label className="block text-xs font-medium text-slate-600">Email</label>
        <input name="email" type="email" required className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      </div>
      <div className="sm:col-span-1">
        <label className="block text-xs font-medium text-slate-600">Ruolo</label>
        <select name="role" defaultValue="EMPLOYEE" className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm">
          <option value="EMPLOYEE">Collaboratore</option>
          <option value="ADMIN">Amministrazione</option>
          <option value="SUPERVISOR">Supervisore</option>
        </select>
      </div>
      <div className="sm:col-span-1">
        <label className="block text-xs font-medium text-slate-600">Costo orario (€)</label>
        <input
          name="hourlyCost"
          type="number"
          step="0.01"
          min="0"
          placeholder="es. 25.00"
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>
      <div className="sm:col-span-1">
        <label className="block text-xs font-medium text-slate-600">Password iniziale</label>
        <input name="password" type="text" required className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      </div>
      <div className="flex items-end gap-2 sm:col-span-1">
        <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">
          Annulla
        </button>
        <button type="submit" disabled={pending} className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60">
          {pending ? "…" : "Crea"}
        </button>
      </div>
      {state?.error && <p className="sm:col-span-6 text-sm text-red-600">{state.error}</p>}
    </form>
  );
}

export function UserList({ users }: { users: User[] }) {
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      {users.map((u) => (
        <div key={u.id}>
          {editingId === u.id ? (
            <EditUserForm user={u} onDone={() => setEditingId(null)} />
          ) : (
            <div
              className={`flex flex-wrap items-center gap-3 rounded-md border px-3 py-2 text-sm ${
                u.active ? "border-slate-200 bg-white" : "border-slate-100 bg-slate-50 opacity-60"
              }`}
            >
              <span className="w-40 shrink-0 font-medium text-slate-800">{u.name}</span>
              <span className="w-56 shrink-0 text-slate-500">{u.email}</span>
              <span className="w-32 shrink-0 text-slate-600">{roleLabels[u.role]}</span>
              <span className="w-28 shrink-0 text-slate-500">
                {u.hourlyCost != null ? `${formatCurrency(u.hourlyCost)}/h` : "Costo non impostato"}
              </span>
              <div className="ml-auto flex shrink-0 gap-2">
                <button
                  onClick={() => setEditingId(u.id)}
                  className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                >
                  Modifica
                </button>
                <button
                  onClick={() => setResettingId(resettingId === u.id ? null : u.id)}
                  className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                >
                  Reimposta password
                </button>
                <button
                  onClick={() => toggleUserActive(u.id, !u.active)}
                  className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                >
                  {u.active ? "Disattiva" : "Riattiva"}
                </button>
              </div>
            </div>
          )}
          {resettingId === u.id && <ResetPasswordForm userId={u.id} onDone={() => setResettingId(null)} />}
        </div>
      ))}
    </div>
  );
}

function EditUserForm({ user, onDone }: { user: User; onDone: () => void }) {
  const [state, formAction, pending] = useActionState<UserFormState | undefined, FormData>(updateUser, undefined);

  useEffect(() => {
    if (state?.success) onDone();
  }, [state, onDone]);

  return (
    <form action={formAction} className="grid grid-cols-1 gap-3 rounded-md bg-slate-50 p-3 sm:grid-cols-6">
      <input type="hidden" name="userId" value={user.id} />
      <div className="sm:col-span-1">
        <label className="block text-xs font-medium text-slate-600">Nome</label>
        <input
          name="name"
          required
          defaultValue={user.name}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>
      <div className="sm:col-span-1">
        <label className="block text-xs font-medium text-slate-600">Email</label>
        <input
          name="email"
          type="email"
          required
          defaultValue={user.email}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>
      <div className="sm:col-span-1">
        <label className="block text-xs font-medium text-slate-600">Ruolo</label>
        <select
          name="role"
          defaultValue={user.role}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        >
          <option value="EMPLOYEE">Collaboratore</option>
          <option value="ADMIN">Amministrazione</option>
          <option value="SUPERVISOR">Supervisore</option>
        </select>
      </div>
      <div className="sm:col-span-1">
        <label className="block text-xs font-medium text-slate-600">Costo orario (€)</label>
        <input
          name="hourlyCost"
          type="number"
          step="0.01"
          min="0"
          defaultValue={user.hourlyCost ?? undefined}
          placeholder="es. 25.00"
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>
      <div className="flex items-end gap-2 sm:col-span-2">
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
          {pending ? "Salvataggio…" : "Salva"}
        </button>
      </div>
      {state?.error && <p className="sm:col-span-6 text-sm text-red-600">{state.error}</p>}
    </form>
  );
}

function ResetPasswordForm({ userId, onDone }: { userId: string; onDone: () => void }) {
  const [state, formAction, pending] = useActionState<UserFormState | undefined, FormData>(
    resetUserPassword,
    undefined
  );

  useEffect(() => {
    if (state?.success) onDone();
  }, [state, onDone]);

  return (
    <form action={formAction} className="mt-1 flex items-end gap-2 rounded-md bg-slate-50 p-3 text-sm">
      <input type="hidden" name="userId" value={userId} />
      <div>
        <label className="block text-xs font-medium text-slate-600">Nuova password</label>
        <input name="password" type="text" required className="mt-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      </div>
      <button type="submit" disabled={pending} className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800">
        Salva
      </button>
      <button type="button" onClick={onDone} className="rounded-md border border-slate-300 px-3 py-1.5 text-slate-600">
        Annulla
      </button>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
