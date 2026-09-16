import Link from "next/link";
import { notFound } from "next/navigation";
import { getClientReport } from "@/lib/queries";
import { formatCurrency, formatDate, formatHours } from "@/lib/format";

function firstDayOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}
function today() {
  return new Date().toISOString().slice(0, 10);
}

export default async function ClientReportDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { clientId } = await params;
  const sp = await searchParams;
  const from = sp.from || firstDayOfMonth();
  const to = sp.to || today();

  const report = await getClientReport(clientId, from, to);
  if (!report) notFound();

  const { client, billableEntries, forfaitEntries, billableHours, forfaitHours, amountToInvoice } = report;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/reports/clients" className="text-sm text-slate-500 hover:underline">
            ← Tutti i clienti
          </Link>
          <h1 className="mt-1 text-lg font-semibold text-slate-900">{client.name}</h1>
          <p className="text-sm text-slate-500">
            Periodo dal {formatDate(from)} al {formatDate(to)}
          </p>
        </div>
        <a
          href={`/api/reports/clients/${clientId}/csv?from=${from}&to=${to}`}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-white"
        >
          Esporta CSV
        </a>
      </div>

      <form className="flex items-end gap-2 text-sm" method="get">
        <div>
          <label className="block text-xs font-medium text-slate-600">Dal</label>
          <input type="date" name="from" defaultValue={from} className="mt-1 rounded-md border border-slate-300 px-2 py-1 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600">Al</label>
          <input type="date" name="to" defaultValue={to} className="mt-1 rounded-md border border-slate-300 px-2 py-1 text-sm" />
        </div>
        <button className="rounded-md border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-50">
          Filtra
        </button>
      </form>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase text-slate-400">Ore da fatturare</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{formatHours(billableHours)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase text-slate-400">Ore incluse nel forfait</p>
          <p className="mt-1 text-2xl font-semibold text-slate-600">{formatHours(forfaitHours)}</p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs uppercase text-emerald-600">Totale da addebitare</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-700">{formatCurrency(amountToInvoice)}</p>
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-slate-900">Attività da fatturare</h2>
        <EntryTable entries={billableEntries} rate={client.hourlyRate} />
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-slate-900">Attività incluse nel forfait</h2>
        <EntryTable entries={forfaitEntries} />
      </div>
    </div>
  );
}

function EntryTable({
  entries,
  rate,
}: {
  entries: {
    id: string;
    date: string;
    description: string;
    hours: number;
    userName: string;
    categoryName: string;
  }[];
  rate?: number | null;
}) {
  if (entries.length === 0) {
    return <p className="text-sm text-slate-500">Nessuna attività in questo periodo.</p>;
  }
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
            {rate ? <th className="px-4 py-2">Importo</th> : null}
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.id} className="border-t border-slate-100">
              <td className="px-4 py-2 text-slate-500">{formatDate(e.date)}</td>
              <td className="px-4 py-2 text-slate-700">{e.userName}</td>
              <td className="px-4 py-2 text-slate-700">{e.categoryName}</td>
              <td className="px-4 py-2 text-slate-700">{e.description}</td>
              <td className="px-4 py-2 text-slate-700">{formatHours(e.hours)}</td>
              {rate ? (
                <td className="px-4 py-2 font-medium text-slate-900">
                  {new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(
                    e.hours * rate
                  )}
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
