import Link from "next/link";
import { auth } from "@/auth";
import { getCollaboratorReport } from "@/lib/queries";
import { formatHours } from "@/lib/format";

function firstDayOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default async function HomePage() {
  const session = await auth();
  const role = session!.user.role;
  const from = firstDayOfMonth();
  const to = today();

  const myReport = await getCollaboratorReport(session!.user.id, from, to);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Ciao, {session!.user.name}</h1>
        <p className="text-sm text-slate-500">Ecco un riepilogo del mese in corso.</p>
      </div>

      {myReport && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase text-slate-400">Ore registrate (mese)</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {formatHours(myReport.totalHours)}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase text-slate-400">Di cui da fatturare</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-700">
              {formatHours(myReport.billableHours)}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase text-slate-400">Incluse nel forfait</p>
            <p className="mt-1 text-2xl font-semibold text-slate-600">
              {formatHours(myReport.forfaitHours)}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Link
          href="/timesheet"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Registra un&apos;attività
        </Link>
        {(role === "ADMIN" || role === "SUPERVISOR") && (
          <Link
            href="/reports/clients"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-white"
          >
            Report clienti da fatturare
          </Link>
        )}
        {role === "SUPERVISOR" && (
          <>
            <Link
              href="/reports/collaboratori"
              className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-white"
            >
              Report collaboratori
            </Link>
            <Link
              href="/reports/overview"
              className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-white"
            >
              Panoramica generale
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
