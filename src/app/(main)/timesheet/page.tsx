import { auth } from "@/auth";
import { getActiveCategories, getActiveClients, getUserEntries } from "@/lib/queries";
import { formatHours } from "@/lib/format";
import { NewEntryForm } from "./entry-form";
import EntriesTable from "./entries-table";

function firstDayOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default async function TimesheetPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const session = await auth();
  const from = params.from || firstDayOfMonth();
  const to = params.to || today();

  const [clients, categories, entries] = await Promise.all([
    getActiveClients(),
    getActiveCategories(),
    getUserEntries(session!.user.id, from, to),
  ]);

  const totalHours = entries.reduce((s, e) => s + e.hours, 0);
  const billableHours = entries.filter((e) => e.billable).reduce((s, e) => s + e.hours, 0);
  const forfaitHours = totalHours - billableHours;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Registra attività</h1>
        <p className="text-sm text-slate-500">
          Inserisci le attività svolte oggi sui clienti, indicando se vanno fatturate extra o sono incluse nel forfait.
        </p>
        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
          {categories.length === 0 ? (
            <p className="text-sm text-amber-700">
              Non ci sono ancora macrocategorie di attività configurate. Chiedi a un supervisore o
              all&apos;amministrazione di crearne almeno una nella sezione &quot;Categorie attività&quot;.
            </p>
          ) : (
            <NewEntryForm clients={clients} categories={categories} />
          )}
        </div>
      </div>

      <div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Le mie attività</h2>
          <form className="flex items-end gap-2 text-sm" method="get">
            <div>
              <label className="block text-xs font-medium text-slate-600">Dal</label>
              <input
                type="date"
                name="from"
                defaultValue={from}
                className="mt-1 rounded-md border border-slate-300 px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600">Al</label>
              <input
                type="date"
                name="to"
                defaultValue={to}
                className="mt-1 rounded-md border border-slate-300 px-2 py-1 text-sm"
              />
            </div>
            <button className="rounded-md border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-50">
              Filtra
            </button>
          </form>
        </div>

        <div className="mt-3 mb-4 flex flex-wrap gap-4 text-sm">
          <span className="rounded-md bg-white px-3 py-1.5 shadow-sm border border-slate-200">
            Totale: <strong>{formatHours(totalHours)}</strong>
          </span>
          <span className="rounded-md bg-emerald-50 px-3 py-1.5 text-emerald-700">
            Da fatturare: <strong>{formatHours(billableHours)}</strong>
          </span>
          <span className="rounded-md bg-slate-100 px-3 py-1.5 text-slate-600">
            Forfait: <strong>{formatHours(forfaitHours)}</strong>
          </span>
        </div>

        <EntriesTable entries={entries} clients={clients} categories={categories} />
      </div>
    </div>
  );
}
