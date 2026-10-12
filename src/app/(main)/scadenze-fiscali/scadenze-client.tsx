"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { FiscalDeadline } from "@/db/schema";
import type { DeadlineForDisplay, DeadlineOccurrence } from "@/lib/fiscal-deadlines";
import { deadlineCategoryLabels } from "@/lib/fiscal-deadlines";
import { toggleFiscalDeadlineActive } from "@/app/actions/fiscal-deadline-actions";
import { ConfirmYearForm } from "./confirm-year-form";
import { NewDeadlineForm, EditDeadlineForm } from "./deadline-rule-form";

const categoryColors: Record<string, string> = {
  FISCALE: "bg-blue-50 text-blue-700 border-blue-200",
  CONTRIBUTIVO: "bg-emerald-50 text-emerald-700 border-emerald-200",
  ASSICURATIVO_LAVORO: "bg-amber-50 text-amber-700 border-amber-200",
  DOGANALE: "bg-purple-50 text-purple-700 border-purple-200",
  TERZO_SETTORE: "bg-pink-50 text-pink-700 border-pink-200",
  TRIBUTO_LOCALE: "bg-slate-100 text-slate-700 border-slate-300",
};

function monthLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  const label = new Intl.DateTimeFormat("it-IT", { month: "long", year: "numeric", timeZone: "UTC" }).format(d);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function dayLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "2-digit", weekday: "short", timeZone: "UTC" })
    .format(d)
    .replace(".", "");
}

type Row = { deadline: FiscalDeadline; occurrence: DeadlineOccurrence };

export function ScadenzeFiscaliClient({
  year,
  rows,
  pending,
  canManage,
  allDeadlines,
}: {
  year: number;
  rows: Row[];
  pending: DeadlineForDisplay[];
  canManage: boolean;
  allDeadlines: FiscalDeadline[];
}) {
  const [showNew, setShowNew] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const visible = rows.filter((r) => !r.occurrence.isMissing);
    const groups = new Map<string, Row[]>();
    for (const row of visible) {
      const key = monthLabel(row.occurrence.date);
      const list = groups.get(key);
      if (list) list.push(row);
      else groups.set(key, [row]);
    }
    return Array.from(groups.entries());
  }, [rows]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Scadenze Fiscali</h1>
          <p className="mt-1 text-sm text-slate-500">
            Scadenzario generico dello studio: Agenzia delle Entrate, INPS, INAIL, Agenzia Dogane e Monopoli, RUNTS.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Link
            href={`/scadenze-fiscali?year=${year - 1}`}
            className="rounded-md border border-slate-300 px-2.5 py-1 text-slate-600 hover:bg-slate-100"
          >
            ← {year - 1}
          </Link>
          <span className="rounded-md bg-slate-900 px-3 py-1 font-medium text-white">{year}</span>
          <Link
            href={`/scadenze-fiscali?year=${year + 1}`}
            className="rounded-md border border-slate-300 px-2.5 py-1 text-slate-600 hover:bg-slate-100"
          >
            {year + 1} →
          </Link>
        </div>
      </div>

      {canManage && pending.length > 0 && (
        <div className="mt-5 rounded-lg border border-amber-300 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-800">
            {pending.length} scadenza{pending.length > 1 ? "e" : ""} da verificare per il {year}
          </p>
          <p className="mt-1 text-xs text-amber-700">
            Voci senza una regola fissa al 100%, o senza ancora una data confermata per quest&apos;anno. Confermando
            qui la data resta salvata: non serve alcun intervento tecnico né un nuovo caricamento del sito.
          </p>
          <ul className="mt-3 space-y-2">
            {pending.map((item) => (
              <li key={item.deadline.id} className="rounded-md border border-amber-200 bg-white/70 p-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-sm font-medium text-slate-800">{item.deadline.title}</span>
                    <span className="ml-2 text-xs text-slate-500">({item.deadline.source})</span>
                  </div>
                  <ConfirmYearForm deadlineId={item.deadline.id} year={year} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 space-y-6">
        {grouped.length === 0 && (
          <p className="rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
            Nessuna scadenza da mostrare per il {year}.
          </p>
        )}
        {grouped.map(([month, monthRows]) => (
          <div key={month}>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">{month}</h2>
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <ul className="divide-y divide-slate-100">
                {monthRows.map((row, idx) => {
                  const unconfirmedReview = row.deadline.needsReview && !row.occurrence.isOverridden;
                  return (
                    <li key={`${row.deadline.id}-${idx}`} className="flex flex-wrap items-center gap-3 px-4 py-3">
                      <div className="w-16 shrink-0 text-sm font-medium text-slate-700">
                        {dayLabel(row.occurrence.date)}
                      </div>
                      <span
                        className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                          categoryColors[row.deadline.category] ?? "bg-slate-100 text-slate-700 border-slate-300"
                        }`}
                      >
                        {deadlineCategoryLabels[row.deadline.category] ?? row.deadline.category}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-slate-800">{row.deadline.title}</p>
                        <p className="text-xs text-slate-400">{row.deadline.source}</p>
                      </div>
                      {unconfirmedReview && (
                        <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                          da verificare
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {canManage && (
        <div className="mt-10 border-t border-slate-200 pt-6">
          <button
            onClick={() => setManageOpen((v) => !v)}
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            {manageOpen ? "▾" : "▸"} Gestione scadenzario (regole)
          </button>

          {manageOpen && (
            <div className="mt-4 space-y-4">
              {!showNew ? (
                <button
                  onClick={() => setShowNew(true)}
                  className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                >
                  + Nuova scadenza
                </button>
              ) : (
                <NewDeadlineForm onDone={() => setShowNew(false)} />
              )}

              <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                <ul className="divide-y divide-slate-100">
                  {allDeadlines.map((d) =>
                    editingId === d.id ? (
                      <li key={d.id} className="p-3">
                        <EditDeadlineForm deadline={d} onDone={() => setEditingId(null)} />
                      </li>
                    ) : (
                      <li key={d.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                        <div className="min-w-0 flex-1">
                          <p className={`truncate text-sm ${d.active ? "text-slate-800" : "text-slate-400 line-through"}`}>
                            {d.title}
                          </p>
                          <p className="text-xs text-slate-400">
                            {deadlineCategoryLabels[d.category] ?? d.category} · {d.source}
                          </p>
                        </div>
                        <button
                          onClick={() => setEditingId(d.id)}
                          className="rounded-md border border-slate-300 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50"
                        >
                          Modifica
                        </button>
                        <button
                          onClick={() => toggleFiscalDeadlineActive(d.id, !d.active)}
                          className="rounded-md border border-slate-300 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50"
                        >
                          {d.active ? "Disattiva" : "Attiva"}
                        </button>
                      </li>
                    )
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
