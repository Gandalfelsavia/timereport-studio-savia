"use client";

import { useState } from "react";
import type { Client } from "@/db/schema";
import { billingTypeLabels, formatCurrency } from "@/lib/format";
import { forfaitPeriodicityLabels } from "@/lib/profitability";
import { toggleClientActive } from "@/app/actions/client-actions";
import { EditClientForm } from "./client-form";

export default function ClientList({ clients }: { clients: Client[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      {clients.map((client) =>
        editingId === client.id ? (
          <EditClientForm key={client.id} client={client} onDone={() => setEditingId(null)} />
        ) : (
          <div
            key={client.id}
            className={`flex flex-wrap items-center gap-3 rounded-md border px-3 py-2 text-sm ${
              client.active ? "border-slate-200 bg-white" : "border-slate-100 bg-slate-50 opacity-60"
            }`}
          >
            <span className="w-48 shrink-0 font-medium text-slate-800">{client.name}</span>
            <span className="w-56 shrink-0 text-slate-500">{billingTypeLabels[client.billingType]}</span>
            <span className="w-32 shrink-0 text-slate-600">
              {client.hourlyRate ? formatCurrency(client.hourlyRate) + "/h" : "—"}
            </span>
            <span className="flex-1 text-slate-600">
              {client.forfaitAmount
                ? `Forfait ${formatCurrency(client.forfaitAmount)}${
                    client.forfaitPeriodicity
                      ? ` / ${forfaitPeriodicityLabels[client.forfaitPeriodicity].toLowerCase()}`
                      : " (periodicità non impostata)"
                  }`
                : ""}
              {client.forfaitNote ? ` (${client.forfaitNote})` : ""}
            </span>
            <div className="ml-auto flex shrink-0 gap-2">
              <button
                onClick={() => setEditingId(client.id)}
                className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
              >
                Modifica
              </button>
              <button
                onClick={() => toggleClientActive(client.id, !client.active)}
                className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
              >
                {client.active ? "Disattiva" : "Riattiva"}
              </button>
            </div>
          </div>
        )
      )}
    </div>
  );
}
