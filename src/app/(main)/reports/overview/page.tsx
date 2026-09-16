import { getOverviewReport } from "@/lib/queries";
import { formatCurrency, formatHours } from "@/lib/format";
import { HoursByClientChart, RevenueByCollaboratorChart } from "./overview-charts";

function firstDayOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}
function today() {
  return new Date().toISOString().slice(0, 10);
}

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const from = params.from || firstDayOfMonth();
  const to = params.to || today();

  const { collaboratorSummaries, clientSummaries, totalRevenue, totalHours } =
    await getOverviewReport(from, to);

  const revenueData = collaboratorSummaries
    .filter((c) => c.revenue > 0 || c.totalHours > 0)
    .map((c) => ({ name: c.user.name, revenue: c.revenue }));

  const hoursData = clientSummaries
    .filter((c) => c.billableHours > 0 || c.forfaitHours > 0)
    .map((c) => ({ name: c.client.name, hours: c.billableHours + c.forfaitHours }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Panoramica generale</h1>
        <p className="text-sm text-slate-500">Vista d&apos;insieme sull&apos;attività dello studio.</p>
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
          <p className="text-xs uppercase text-slate-400">Ore totali registrate</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{formatHours(totalHours)}</p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs uppercase text-emerald-600">Fatturato totale prodotto</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-700">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase text-slate-400">Clienti attivi</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{clientSummaries.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-900">Fatturato per collaboratore</h2>
          <RevenueByCollaboratorChart data={revenueData} />
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-900">Ore per cliente</h2>
          <HoursByClientChart data={hoursData} />
        </div>
      </div>
    </div>
  );
}
