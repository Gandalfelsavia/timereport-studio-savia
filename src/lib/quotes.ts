import type { Quote, QuoteLine } from "@/db/schema";

// Un "una tantum" non entra nel calcolo del ricorrente annuo (viene sempre
// mostrato a parte, come "Totale annuo previsto ESCLUSO start up" negli
// esempi reali dello studio).
export function periodicityMultiplier(periodicity: QuoteLine["periodicity"]): number {
  switch (periodicity) {
    case "MENSILE":
      return 12;
    case "TRIMESTRALE":
      return 4;
    case "ANNUALE":
      return 1;
    case "UNA_TANTUM":
    default:
      return 0;
  }
}

export function lineAnnualAmount(line: Pick<QuoteLine, "amount" | "periodicity">): number {
  return (line.amount ?? 0) * periodicityMultiplier(line.periodicity);
}

export function parseDiscountLineIds(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export function stringifyDiscountLineIds(ids: string[]): string | null {
  return ids.length > 0 ? JSON.stringify(ids) : null;
}

export type QuoteTotals = {
  unaTantumTotal: number;
  annualTotal: number;
  quarterlyTotal: number;
  discountBase: number;
  discountAmount: number;
  discountedAnnualTotal: number;
  discountedQuarterlyTotal: number;
};

// Calcola il riepilogo di un preventivo (Previsione Gestione) a partire dalle
// righe. Replica lo schema visto negli esempi reali dello studio:
// - modalità ITEMIZED: il totale annuo è la somma delle righe ricorrenti
//   (mensili x12, trimestrali x4, annuali x1), le voci una tantum sono
//   escluse ed elencate a parte;
// - modalità FLAT (Forfettario, ETS/ASD): il totale annuo è un importo unico
//   inserito manualmente (flatAnnualAmount), le righe sono solo descrittive.
// Lo sconto (se attivo) si applica o a un sottoinsieme di righe scelto
// dall'utente, o all'intero totale se non ne è stata scelta nessuna.
export function computeQuoteTotals(
  quote: Pick<
    Quote,
    "pricingMode" | "flatAnnualAmount" | "discountEnabled" | "discountKind" | "discountValue" | "discountLineIds"
  >,
  lines: Pick<QuoteLine, "id" | "amount" | "periodicity">[]
): QuoteTotals {
  const unaTantumTotal = lines
    .filter((l) => l.periodicity === "UNA_TANTUM")
    .reduce((sum, l) => sum + (l.amount ?? 0), 0);

  const annualTotal =
    quote.pricingMode === "FLAT"
      ? quote.flatAnnualAmount ?? 0
      : lines.filter((l) => l.periodicity !== "UNA_TANTUM").reduce((sum, l) => sum + lineAnnualAmount(l), 0);

  const quarterlyTotal = annualTotal / 4;

  let discountBase = annualTotal;
  if (quote.pricingMode === "ITEMIZED") {
    const selectedIds = parseDiscountLineIds(quote.discountLineIds);
    if (selectedIds.length > 0) {
      discountBase = lines
        .filter((l) => selectedIds.includes(l.id) && l.periodicity !== "UNA_TANTUM")
        .reduce((sum, l) => sum + lineAnnualAmount(l), 0);
    }
  }

  let discountAmount = 0;
  if (quote.discountEnabled && quote.discountValue) {
    discountAmount =
      quote.discountKind === "PERCENT" ? discountBase * (quote.discountValue / 100) : quote.discountValue;
  }

  const discountedAnnualTotal = annualTotal - discountAmount;
  const discountedQuarterlyTotal = discountedAnnualTotal / 4;

  return {
    unaTantumTotal,
    annualTotal,
    quarterlyTotal,
    discountBase,
    discountAmount,
    discountedAnnualTotal,
    discountedQuarterlyTotal,
  };
}

export const periodicityLabels: Record<QuoteLine["periodicity"], string> = {
  UNA_TANTUM: "Una tantum",
  MENSILE: "Mensile",
  TRIMESTRALE: "Trimestrale",
  ANNUALE: "Annuale",
};

export const tariffSourceLabels: Record<QuoteLine["tariffSource"], string> = {
  ANC: "ANC",
  UNIONE_GIOVANI: "Unione Giovani",
  LIBERO: "Libero",
};
