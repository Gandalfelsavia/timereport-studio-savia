import Link from "next/link";
import { auth } from "@/auth";
import { getAllClientsReportSummary } from "@/lib/queries";
import { formatCurrency, formatHours, formatPercent } from "@/lib/format";

function firstDayOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}
function today() {
  return new Date().toISOString().slice(0, 10);
}

export default async function ClientsReportPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const from = params.from || firstDayOfMonth();
  const to = params.to || today();

  const session = await auth();
  // Il costo del lavoro e il margine per cliente sono visibili solo al
  // Supervisore: rivelano indirettamente il costo orario dei collaboratori.
  const showMargin = session?.user?.role === "SUPERVISOR";

  const summaries = await getAllClientsReportSummary(from, to);
  const totalToInvoice = summaries.reduce((s, c) => s + c.amountToInvoice, 0);
  const totalCost = summaries.reduce((s, c) => s + c.margin.cost, 0);
  const totalMargin = summaries.reduce((s, c) => s + c.margin.margin, 0);
  const anyMissingCost = summaries.some((c) => c.margin.hoursWithoutCost > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Report clienti</h1>
        <p className="text-sm text-slate-500">
          Attività da addebitare per ciascun cliente nel periodo selezionato.
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

      {showMargin && anyMissingCost && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Alcune attività del periodo sono di collaboratori senza costo orario impostato: il costo e il
          margine di quei clienti sono sottostimati. Imposta il costo orario in Utenti.
        </p>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Cliente</th>
              <th className="px-4 py-2">Ore da fatturare</th>
              <th className="px-4 py-2">Ore forfait</th>
              <th className="px-4 py-2">Da addebitare</th>
              {showMargin && <th className="px-4 py-2">Costo</th>}
              {showMargin && <th className="px-4 py-2">Margine</th>}
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {summaries.map(({ client, billableHours, forfaitHours, amountToInvoice, margin }) => (
              <tr key={client.id} className="border-t border-slate-100">
                <td className="px-4 py-2 font-medium text-slate-800">{client.name}</td>
                <td className="px-4 py-2 text-slate-600">{formatHours(billableHours)}</td>
                <td className="px-4 py-2 text-slate-600">{formatHours(forfaitHours)}</td>
                <td className="px-4 py-2 font-medium text-slate-900">
                  {amountToInvoice > 0 ? formatCurrency(amountToInvoice) : "—"}
                </td>
                {showMargin && (
                  <td className="px-4 py-2 text-slate-600">
                    {formatCurrency(margin.cost)}
                    {margin.hoursWithoutCost > 0 && (
                      <span className="ml-1 text-amber-600" title="Alcune ore non hanno un costo orario impostato">
                        *
                      </span>
                    )}
                  </td>
                )}
                {showMargin && (
                  <td className={`px-4 py-2 font-medium ${margin.margin >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                    {formatCurrency(margin.margin)}
                    {margin.marginPercent != null && (
                      <span className="ml-1 text-xs font-normal text-slate-400">
                        ({formatPercent(margin.marginPercent)})
                      </span>
                    )}
                  </td>
                )}
                <td className="px-4 py-2 text-right">
                  <Link
                    href={`/reports/clients/${client.id}?from=${from}&to=${to}`}
                    className="text-sm text-slate-600 underline hover:text-slate-900"
                  >
                    Dettaglio
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-200 bg-slate-50 font-medium">
              <td className="px-4 py-2" colSpan={3}>
                Totale periodo
              </td>
              <td className="px-4 py-2">{formatCurrency(totalToInvoice)}</td>
              {showMargin && <td className="px-4 py-2">{formatCurrency(totalCost)}</td>}
              {showMargin && (
                <td className={`px-4 py-2 ${totalMargin >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                  {formatCurrency(totalMargin)}
                </td>
              )}
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
      {showMargin && (
        <p className="text-xs text-slate-400">
          Il ricavo dei clienti a forfait è ripartito pro-rata sul periodo selezionato in base alla
          periodicità impostata in scheda cliente: è una stima gestionale, non un valore di fatturazione.
        </p>
      )}
    </div>
  );
}
