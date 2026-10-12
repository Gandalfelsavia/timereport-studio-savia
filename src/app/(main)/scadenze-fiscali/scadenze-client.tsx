"use client";

import { useEffect, useMemo, useState } from "react";
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

// Chiave "YYYY-MM" di un mese, usata per filtrare e confrontare le selezioni.
function monthKeyFor(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function shortMonthLabel(year: number, month: number): string {
  const d = new Date(Date.UTC(year, month - 1, 1));
  const label = new Intl.DateTimeFormat("it-IT", { month: "short", timeZone: "UTC" }).format(d).replace(".", "");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

// Di default mostriamo il mese corrente e quello successivo, ma solo quando
// l'anno visualizzato è l'anno reale in corso: se si naviga su un altro anno
// (freccette), ha più senso partire mostrando tutti i mesi di quell'anno.
function computeDefaultMonths(year: number): string[] | "all" {
  const now = new Date();
  const realYear = now.getFullYear();
  if (realYear !== year) return "all";
  const month = now.getMonth() + 1;
  const curKey = monthKeyFor(year, month);
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextKey = monthKeyFor(nextYear, nextMonth);
  return [curKey, nextKey];
}

type Row = { deadline: FiscalDeadline; occurrence: DeadlineOccurrence };

export function ScadenzeFiscaliClient({
  year,
  rows,
  extendedRows,
  pending,
  canManage,
  allDeadlines,
}: {
  year: number;
  rows: Row[];
  extendedRows: Row[];
  pending: DeadlineForDisplay[];
  canManage: boolean;
  allDeadlines: FiscalDeadline[];
}) {
  const [showNew, setShowNew] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedMonths, setSelectedMonths] = useState<string[] | "all">(() => computeDefaultMonths(year));

  // Se si cambia anno con le freccette, la selezione ripartiva dal valore
  // predefinito per il nuovo anno (mese corrente+successivo se è l'anno in
  // corso, altrimenti tutti i mesi).
  useEffect(() => {
    setSelectedMonths(computeDefaultMonths(year));
  }, [year]);

  function toggleMonth(key: string) {
    setSelectedMonths((prev) => {
      const list = prev === "all" ? [] : [...prev];
      const idx = list.indexOf(key);
      if (idx >= 0) list.splice(idx, 1);
      else list.push(key);
      return list.length ? list : "all";
    });
  }

  const grouped = useMemo(() => {
    const source = selectedMonths === "all" ? rows : extendedRows;
    const visible = source.filter((r) => {
      if (r.occurrence.isMissing) return false;
      if (selectedMonths === "all") return true;
      return selectedMonths.includes(r.occurrence.date.slice(0, 7));
    });
    const groups = new Map<string, Row[]>();
    for (const row of visible) {
      const key = monthLabel(row.occurrence.date);
      const list = groups.get(key);
      if (list) list.push(row);
      else groups.set(key, [row]);
    }
    return Array.from(groups.entries());
  }, [rows, extendedRows, selectedMonths]);

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

      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => setSelectedMonths(computeDefaultMonths(year))}
          className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
        >
          Mese corrente
        </button>
        <button
          onClick={() => setSelectedMonths("all")}
          className={`rounded-md border px-2.5 py-1 text-xs font-medium ${
            selectedMonths === "all"
              ? "border-slate-900 bg-slate-900 text-white"
              : "border-slate-300 text-slate-600 hover:bg-slate-100"
          }`}
        >
          Tutti i mesi
        </button>
        <span className="mx-1 h-4 w-px bg-slate-200" />
        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
          const key = monthKeyFor(year, m);
          const active = selectedMonths !== "all" && selectedMonths.includes(key);
          return (
            <button
              key={key}
              onClick={() => toggleMonth(key)}
              className={`rounded-md border px-2.5 py-1 text-xs font-medium ${
                active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {shortMonthLabel(year, m)}
            </button>
          );
        })}
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
            Nessuna scadenza da mostrare per il periodo selezionato.
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
