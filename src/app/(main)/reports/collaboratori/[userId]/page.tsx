import Link from "next/link";
import { notFound } from "next/navigation";
import { getCollaboratorReport } from "@/lib/queries";
import { formatCurrency, formatDate, formatHours } from "@/lib/format";

function firstDayOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}
function today() {
  return new Date().toISOString().slice(0, 10);
}

export default async function CollaboratorDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { userId } = await params;
  const sp = await searchParams;
  const from = sp.from || firstDayOfMonth();
  const to = sp.to || today();

  const report = await getCollaboratorReport(userId, from, to);
  if (!report) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/reports/collaboratori" className="text-sm text-slate-500 hover:underline">
          ← Tutti i collaboratori
        </Link>
        <h1 className="mt-1 text-lg font-semibold text-slate-900">{report.user.name}</h1>
        <p className="text-sm text-slate-500">
          Periodo dal {formatDate(from)} al {formatDate(to)}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase text-slate-400">Ore totali</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{formatHours(report.totalHours)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase text-slate-400">Ore da fatturare</p>
          <p className="mt-1 text-2xl font-semibold text-slate-700">{formatHours(report.billableHours)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase text-slate-400">Ore forfait</p>
          <p className="mt-1 text-2xl font-semibold text-slate-600">{formatHours(report.forfaitHours)}</p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs uppercase text-emerald-600">Fatturato prodotto</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-700">{formatCurrency(report.revenue)}</p>
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-slate-900">Ripartizione per cliente</h2>
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Cliente</th>
                <th className="px-4 py-2">Ore totali</th>
                <th className="px-4 py-2">Ore da fatturare</th>
                <th className="px-4 py-2">Fatturato</th>
              </tr>
            </thead>
            <tbody>
              {report.byClient.map((c) => (
                <tr key={c.clientName} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-medium text-slate-800">{c.clientName}</td>
                  <td className="px-4 py-2 text-slate-600">{formatHours(c.hours)}</td>
                  <td className="px-4 py-2 text-slate-600">{formatHours(c.billableHours)}</td>
                  <td className="px-4 py-2 font-medium text-slate-900">{formatCurrency(c.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-slate-900">Dettaglio attività</h2>
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Data</th>
                <th className="px-4 py-2">Cliente</th>
                <th className="px-4 py-2">Categoria</th>
                <th className="px-4 py-2">Descrizione</th>
                <th className="px-4 py-2">Ore</th>
                <th className="px-4 py-2">Tipo</th>
              </tr>
            </thead>
            <tbody>
              {report.entries.map((e) => (
                <tr key={e.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 text-slate-500">{formatDate(e.date)}</td>
                  <td className="px-4 py-2 text-slate-700">{e.clientName}</td>
                  <td className="px-4 py-2 text-slate-700">{e.categoryName}</td>
                  <td className="px-4 py-2 text-slate-700">{e.description}</td>
                  <td className="px-4 py-2 text-slate-700">{formatHours(e.hours)}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        e.billable ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {e.billable ? "Da fatturare" : "Forfait"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
