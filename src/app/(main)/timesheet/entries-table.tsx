"use client";

import { useState } from "react";
import { formatDate, formatHours, formatCurrency } from "@/lib/format";
import { deleteTimeEntry } from "@/app/actions/timesheet-actions";
import { EditEntryForm } from "./entry-form";

type Entry = {
  id: string;
  date: string;
  clientId: string;
  clientName: string;
  categoryId: string;
  categoryName: string;
  description: string;
  startTime: string | null;
  endTime: string | null;
  hours: number;
  billable: boolean;
  billingAmount: number | null;
  expenseAmount: number | null;
  expenseNote: string | null;
};

export default function EntriesTable({
  entries,
  clients,
  categories,
}: {
  entries: Entry[];
  clients: { id: string; name: string }[];
  categories: { id: string; name: string }[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  if (entries.length === 0) {
    return <p className="text-sm text-slate-500">Nessuna attività registrata in questo periodo.</p>;
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) =>
        editingId === entry.id ? (
          <EditEntryForm
            key={entry.id}
            entry={entry}
            clients={clients}
            categories={categories}
            onDone={() => setEditingId(null)}
          />
        ) : (
          <div
            key={entry.id}
            className="flex flex-wrap items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <span className="w-20 shrink-0 text-slate-500">{formatDate(entry.date)}</span>
            <span className="w-36 shrink-0 font-medium text-slate-800">{entry.clientName}</span>
            <span className="w-32 shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-center text-xs font-medium text-slate-600">
              {entry.categoryName}
            </span>
            <span className="flex-1 text-slate-600">{entry.description}</span>
            {entry.startTime && entry.endTime && (
              <span className="shrink-0 text-xs text-slate-400">
                {entry.startTime.slice(0, 5)}–{entry.endTime.slice(0, 5)}
              </span>
            )}
            <span className="shrink-0 text-slate-700">{formatHours(entry.hours)}</span>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                entry.billable ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
              }`}
            >
              {entry.billable ? "Da fatturare" : "Forfait"}
            </span>
            {entry.billable && entry.billingAmount != null && (
              <span className="shrink-0 text-xs font-medium text-emerald-700">
                {formatCurrency(entry.billingAmount)}
              </span>
            )}
            {entry.billable && entry.expenseAmount != null && entry.expenseAmount > 0 && (
              <span
                className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700"
                title={entry.expenseNote ?? undefined}
              >
                + {formatCurrency(entry.expenseAmount)} spese
              </span>
            )}
            <div className="ml-auto flex shrink-0 gap-2">
              <button
                onClick={() => setEditingId(entry.id)}
                className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
              >
                Modifica
              </button>
              {pendingDeleteId === entry.id ? (
                <>
                  <button
                    onClick={async () => {
                      await deleteTimeEntry(entry.id);
                      setPendingDeleteId(null);
                    }}
                    className="rounded-md bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700"
                  >
                    Conferma
                  </button>
                  <button
                    onClick={() => setPendingDeleteId(null)}
                    className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600"
                  >
                    Annulla
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setPendingDeleteId(entry.id)}
                  className="rounded-md border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                >
                  Elimina
                </button>
              )}
            </div>
          </div>
        )
      )}
    </div>
  );
}
