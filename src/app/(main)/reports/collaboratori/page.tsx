import Link from "next/link";
import { getAllEmployees, getCollaboratorReport } from "@/lib/queries";
import { formatCurrency, formatHours } from "@/lib/format";

function firstDayOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}
function today() {
  return new Date().toISOString().slice(0, 10);
}

export default async function CollaboratorsReportPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const from = params.from || firstDayOfMonth();
  const to = params.to || today();

  const employees = await getAllEmployees();
  const reports = await Promise.all(
    employees.map((e) => getCollaboratorReport(e.id, from, to))
  );

  const totalRevenue = reports.reduce((s, r) => s + (r?.revenue ?? 0), 0);
  const totalHours = reports.reduce((s, r) => s + (r?.totalHours ?? 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Report collaboratori</h1>
        <p className="text-sm text-slate-500">
          Ore registrate e fatturato prodotto da ciascun collaboratore nel periodo selezionato.
        </p>
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase text-slate-400">Ore totali registrate</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{formatHours(totalHours)}</p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs uppercase text-emerald-600">Fatturato totale prodotto</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-700">{formatCurrency(totalRevenue)}</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Collaboratore</th>
              <th className="px-4 py-2">Ore totali</th>
              <th className="px-4 py-2">Ore da fatturare</th>
              <th className="px-4 py-2">Ore forfait</th>
              <th className="px-4 py-2">Fatturato prodotto</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {reports.map(
              (r) =>
                r && (
                  <tr key={r.user.id} className="border-t border-slate-100">
                    <td className="px-4 py-2 font-medium text-slate-800">{r.user.name}</td>
                    <td className="px-4 py-2 text-slate-600">{formatHours(r.totalHours)}</td>
                    <td className="px-4 py-2 text-slate-600">{formatHours(r.billableHours)}</td>
                    <td className="px-4 py-2 text-slate-600">{formatHours(r.forfaitHours)}</td>
                    <td className="px-4 py-2 font-medium text-slate-900">{formatCurrency(r.revenue)}</td>
                    <td className="px-4 py-2 text-right">
                      <Link
                        href={`/reports/collaboratori/${r.user.id}?from=${from}&to=${to}`}
                        className="text-sm text-slate-600 underline hover:text-slate-900"
                      >
                        Dettaglio
                      </Link>
                    </td>
                  </tr>
                )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
