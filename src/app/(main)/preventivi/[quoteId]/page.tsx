import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getQuoteWithLines,
  getActiveClients,
  getActiveQuoteEntities,
  getFeeScheduleItems,
} from "@/lib/queries";
import { computeQuoteTotals } from "@/lib/quotes";
import { formatCurrency, formatDate } from "@/lib/format";
import { quoteFamilyLabels } from "@/lib/quote-templates";
import { QuoteHeaderForm } from "./quote-header-form";
import { QuoteLinesEditor } from "./quote-lines-editor";
import { QuoteDiscountForm } from "./quote-discount-form";
import { DeleteQuoteButton } from "./delete-quote-button";

export default async function QuoteDetailPage({
  params,
}: PageProps<"/preventivi/[quoteId]">) {
  const { quoteId } = await params;

  const [data, clients, entities, feeScheduleItems] = await Promise.all([
    getQuoteWithLines(quoteId),
    getActiveClients(),
    getActiveQuoteEntities(),
    getFeeScheduleItems(),
  ]);

  if (!data || !data.entity) notFound();

  const { quote, entity, lines } = data;
  const totals = computeQuoteTotals(quote, lines);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/preventivi" className="text-xs text-slate-500 hover:underline">
            ← Tutti i preventivi
          </Link>
          <h1 className="text-lg font-semibold text-slate-900">{quote.recipientName}</h1>
          <p className="text-sm text-slate-500">
            {quoteFamilyLabels[quote.family]} · {entity.name} · {formatDate(quote.quoteDate)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/api/preventivi/${quote.id}/pdf`}
            target="_blank"
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            Genera PDF
          </a>
          <DeleteQuoteButton quoteId={quote.id} />
        </div>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Dati preventivo</h2>
        <QuoteHeaderForm quote={quote} clients={clients} entities={entities} />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">
          Voci del preventivo {quote.pricingMode === "FLAT" && (
            <span className="font-normal text-slate-400">
              (descrittive: il totale è un importo unico impostato qui sotto)
            </span>
          )}
        </h2>
        <QuoteLinesEditor
          quoteId={quote.id}
          lines={lines}
          feeScheduleItems={feeScheduleItems}
          pricingMode={quote.pricingMode}
        />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Sconto (facoltativo)</h2>
        <QuoteDiscountForm quote={quote} lines={lines} />
      </section>

      <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Riepilogo (Previsione Gestione)</h2>
        <div className="space-y-1 text-sm">
          {totals.unaTantumTotal > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>Voci una tantum</span>
              <span>{formatCurrency(totals.unaTantumTotal)} + IVA</span>
            </div>
          )}
          <div className="flex justify-between font-medium text-slate-900">
            <span>
              Totale Annuo Previsto{totals.unaTantumTotal > 0 ? " (escluso una tantum)" : ""}
            </span>
            <span>{formatCurrency(totals.annualTotal)} + IVA</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Totale Trimestrale Previsto</span>
            <span>{formatCurrency(totals.quarterlyTotal)} + IVA</span>
          </div>
          {quote.discountEnabled && (
            <>
              <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 font-medium text-emerald-700">
                <span>{quote.discountLabel || "Totale con sconto"}</span>
                <span>{formatCurrency(totals.discountedAnnualTotal)} + IVA</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Trimestrale con sconto</span>
                <span>{formatCurrency(totals.discountedQuarterlyTotal)} + IVA</span>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
