"use client";

import { useState } from "react";
import { formatDate, formatHours, formatCurrency } from "@/lib/format";
import { entryFeeAmount, entryExpenseAmount } from "@/lib/billing";
import { EditEntryForm } from "@/app/(main)/timesheet/entry-form";

type Entry = {
  id: string;
  clientId: string;
  categoryId: string;
  date: string;
  description: string;
  startTime: string | null;
  endTime: string | null;
  hours: number;
  billable: boolean;
  billingAmount: number | null;
  expenseAmount: number | null;
  expenseNote: string | null;
  userName: string;
  categoryName: string;
};

// Tabella delle attività di un cliente, con possibilità di modifica: usata nel
// report cliente da amministrazione/supervisore, che spesso devono impostare
// loro l'importo da fatturare o il costo sostenuto di attività caricate dai
// collaboratori (che non sempre sanno quanto va addebitato).
export function ClientReportEntriesTable({
  entries,
  clients,
  categories,
  rate,
}: {
  entries: Entry[];
  clients: { id: string; name: string }[];
  categories: { id: string; name: string }[];
  rate?: number | null;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);

  if (entries.length === 0) {
    return <p className="text-sm text-slate-500">Nessuna attività in questo periodo.</p>;
  }

  const hasExpenses = entries.some((e) => (e.expenseAmount ?? 0) > 0);
  const showAmount = !!rate || entries.some((e) => e.billingAmount != null);

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-2">Data</th>
            <th className="px-4 py-2">Collaboratore</th>
            <th className="px-4 py-2">Categoria</th>
            <th className="px-4 py-2">Descrizione</th>
            <th className="px-4 py-2">Ore</th>
            {showAmount ? <th className="px-4 py-2">Importo</th> : null}
            {hasExpenses ? <th className="px-4 py-2">Costi sostenuti</th> : null}
            <th className="px-4 py-2" />
          </tr>
        </thead>
        <tbody>
          {entries.map((e) =>
            editingId === e.id ? (
              <tr key={e.id}>
                <td colSpan={8} className="p-2">
                  <EditEntryForm
                    entry={e}
                    clients={clients}
                    categories={categories}
                    onDone={() => setEditingId(null)}
                  />
                </td>
              </tr>
            ) : (
              <tr key={e.id} className="border-t border-slate-100">
                <td className="px-4 py-2 text-slate-500">{formatDate(e.date)}</td>
                <td className="px-4 py-2 text-slate-700">{e.userName}</td>
                <td className="px-4 py-2 text-slate-700">{e.categoryName}</td>
                <td className="px-4 py-2 text-slate-700">{e.description}</td>
                <td className="px-4 py-2 text-slate-700">{formatHours(e.hours)}</td>
                {showAmount ? (
                  <td className="px-4 py-2 font-medium text-slate-900">
                    {e.billable ? formatCurrency(entryFeeAmount(e, rate ?? 0)) : "—"}
                  </td>
                ) : null}
                {hasExpenses ? (
                  <td className="px-4 py-2 text-amber-700" title={e.expenseNote ?? undefined}>
                    {e.billable && (e.expenseAmount ?? 0) > 0 ? formatCurrency(entryExpenseAmount(e)) : "—"}
                  </td>
                ) : null}
                <td className="px-4 py-2 text-right">
                  <button
                    onClick={() => setEditingId(e.id)}
                    className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                  >
                    Modifica
                  </button>
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
}
