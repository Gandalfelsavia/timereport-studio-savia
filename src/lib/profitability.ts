// Calcolo della redditività per cliente: ricavo (fatturato + quota forfait
// competenza del periodo) meno costo del lavoro (ore × costo orario di
// ciascun collaboratore), per il periodo selezionato nel report.

export type ForfaitPeriodicity = "MENSILE" | "TRIMESTRALE" | "ANNUALE";

// Durata media in giorni di un periodo, usata per calcolare una tariffa
// giornaliera dal forfait e da lì la quota di competenza di un intervallo di
// date qualsiasi (i filtri del report non sono necessariamente allineati a
// mesi/trimestri/anni solari). È una ripartizione pro-rata temporis
// approssimata (gestionale), non un valore contabile/fiscale.
const AVG_DAYS_PER_MONTH = 30.4375; // 365.25 / 12
const PERIOD_MONTHS: Record<ForfaitPeriodicity, number> = {
  MENSILE: 1,
  TRIMESTRALE: 3,
  ANNUALE: 12,
};

export const forfaitPeriodicityLabels: Record<ForfaitPeriodicity, string> = {
  MENSILE: "Mensile",
  TRIMESTRALE: "Trimestrale",
  ANNUALE: "Annuale",
};

function daysBetweenInclusive(from: string, to: string): number {
  const fromDate = new Date(`${from}T00:00:00Z`);
  const toDate = new Date(`${to}T00:00:00Z`);
  const diffMs = toDate.getTime() - fromDate.getTime();
  if (diffMs < 0) return 0;
  return diffMs / (1000 * 60 * 60 * 24) + 1;
}

// Quota di ricavo forfait di competenza dell'intervallo [from, to] (estremi
// inclusi), calcolata pro-rata sui giorni a partire dalla tariffa
// giornaliera implicita nel forfait periodico.
export function forfaitRevenueForRange(
  forfaitAmount: number,
  periodicity: ForfaitPeriodicity,
  from: string,
  to: string
): number {
  const daysInPeriod = PERIOD_MONTHS[periodicity] * AVG_DAYS_PER_MONTH;
  const dailyRate = forfaitAmount / daysInPeriod;
  return dailyRate * daysBetweenInclusive(from, to);
}

export type ProfitabilityEntry = { hours: number; hourlyCost: number | null };

// Costo del lavoro: somma di ore × costo orario del collaboratore su TUTTE le
// attività del periodo (fatturabili e a forfait), perché il tempo impiegato
// ha un costo indipendentemente dal fatto che venga rifatturato extra.
// Le attività di collaboratori senza costo orario impostato non contribuiscono
// al costo (vengono segnalate a parte, non silenziosamente ignorate).
export function computeLaborCost(entries: ProfitabilityEntry[]): {
  cost: number;
  hoursWithoutCost: number;
} {
  let cost = 0;
  let hoursWithoutCost = 0;
  for (const e of entries) {
    if (e.hourlyCost == null) {
      hoursWithoutCost += e.hours;
      continue;
    }
    cost += e.hours * e.hourlyCost;
  }
  return { cost, hoursWithoutCost };
}

export type ClientMargin = {
  revenue: number;
  cost: number;
  margin: number;
  marginPercent: number | null; // null se il ricavo è 0 (percentuale non significativa)
  hoursWithoutCost: number;
  forfaitRevenueEstimated: boolean; // true se parte del ricavo è una stima pro-rata dal forfait
};

export function computeClientMargin(params: {
  billedRevenue: number; // fatturato attività "da fatturare extra" nel periodo
  forfaitAmount: number | null;
  forfaitPeriodicity: ForfaitPeriodicity | null;
  billingType: "HOURLY" | "FORFAIT" | "MIXED";
  from: string;
  to: string;
  laborEntries: ProfitabilityEntry[];
}): ClientMargin {
  const { cost, hoursWithoutCost } = computeLaborCost(params.laborEntries);

  let forfaitRevenue = 0;
  let forfaitRevenueEstimated = false;
  if (
    (params.billingType === "FORFAIT" || params.billingType === "MIXED") &&
    params.forfaitAmount &&
    params.forfaitPeriodicity
  ) {
    forfaitRevenue = forfaitRevenueForRange(
      params.forfaitAmount,
      params.forfaitPeriodicity,
      params.from,
      params.to
    );
    forfaitRevenueEstimated = true;
  }

  const revenue = params.billedRevenue + forfaitRevenue;
  const margin = revenue - cost;
  const marginPercent = revenue > 0 ? (margin / revenue) * 100 : null;

  return { revenue, cost, margin, marginPercent, hoursWithoutCost, forfaitRevenueEstimated };
}
