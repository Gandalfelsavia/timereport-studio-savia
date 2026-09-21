import Link from "next/link";
import { getAllQuotes, getActiveClients, getActiveQuoteEntities } from "@/lib/queries";
import { formatDate } from "@/lib/format";
import { quoteFamilyLabels } from "@/lib/quote-templates";
import { NewQuoteForm } from "./new-quote-form";

export default async function PreventiviPage() {
  const [quotesList, clients, entities] = await Promise.all([
    getAllQuotes(),
    getActiveClients(),
    getActiveQuoteEntities(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Preventivi</h1>
          <p className="text-sm text-slate-500">
            Componi un preventivo scegliendo entità emittente, cliente e famiglia (Società,
            Identificazione diretta/Rappresentanza fiscale, ETS/ASD, Ditta individuale, Forfettario).
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <NewQuoteForm clients={clients} entities={entities} />
      </div>

      <div className="space-y-2">
        {quotesList.length === 0 ? (
          <p className="text-sm text-slate-500">Nessun preventivo ancora creato.</p>
        ) : (
          quotesList.map((q) => (
            <Link
              key={q.id}
              href={`/preventivi/${q.id}`}
              className="flex flex-wrap items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50"
            >
              <span className="w-56 shrink-0 font-medium text-slate-800">{q.recipientName}</span>
              <span className="w-64 shrink-0 text-slate-500">{q.entityName}</span>
              <span className="w-64 shrink-0 text-slate-500">{quoteFamilyLabels[q.family]}</span>
              <span className="ml-auto shrink-0 text-slate-400">{formatDate(q.quoteDate)}</span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
