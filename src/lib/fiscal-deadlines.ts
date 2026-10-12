import { nextBusinessDayIso, makeIsoDate } from "@/lib/italian-holidays";
import type { FiscalDeadline, FiscalDeadlineYearlyValue } from "@/db/schema";

export const deadlineCategoryLabels: Record<string, string> = {
  FISCALE: "Fiscale",
  CONTRIBUTIVO: "Contributivo",
  ASSICURATIVO_LAVORO: "Assicurativo/Lavoro",
  DOGANALE: "Doganale",
  TERZO_SETTORE: "Terzo Settore",
  TRIBUTO_LOCALE: "Tributo locale",
};

export const deadlineRuleTypeLabels: Record<string, string> = {
  MONTHLY_DAY: "Ogni mese",
  ANNUAL_DATE: "Data fissa annuale",
  DAYS_AFTER_YEAR_END: "N giorni dalla chiusura dell'esercizio",
  MANUAL_YEARLY: "Fissata di anno in anno (manuale)",
};

// Se la data cadrebbe tra il 1° e il 20 agosto, la sospensione feriale degli
// adempimenti fiscali la proroga al 20 agosto (poi comunque soggetta allo
// spostamento weekend/festivo standard).
function applyAugustSuspension(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (m === 8 && d >= 1 && d <= 20) {
    return makeIsoDate(y, 8, 20);
  }
  return iso;
}

export type DeadlineOccurrence = {
  date: string; // ISO, già con eventuali spostamenti applicati
  isOverridden: boolean; // il valore viene da fiscalDeadlineYearlyValues, non dalla regola
  isMissing: boolean; // MANUAL_YEARLY senza valore per l'anno richiesto
};

// Calcola le date (una o più) in cui una scadenza ricorre per un dato anno,
// applicando la regola configurata e, quando presente, un override/valore
// manuale per quell'anno specifico.
export function computeOccurrences(
  deadline: Pick<FiscalDeadline, "ruleType" | "ruleDay" | "ruleMonth" | "ruleDaysAfterYearEnd" | "augustSuspension">,
  year: number,
  yearlyValues: Pick<FiscalDeadlineYearlyValue, "year" | "date">[]
): DeadlineOccurrence[] {
  const override = yearlyValues.find((v) => v.year === year);

  if (deadline.ruleType === "MANUAL_YEARLY") {
    if (override) {
      return [{ date: override.date, isOverridden: true, isMissing: false }];
    }
    return [{ date: "", isOverridden: false, isMissing: true }];
  }

  if (override) {
    return [{ date: override.date, isOverridden: true, isMissing: false }];
  }

  if (deadline.ruleType === "MONTHLY_DAY") {
    if (deadline.ruleDay == null) return [];
    const occurrences: DeadlineOccurrence[] = [];
    for (let month = 1; month <= 12; month++) {
      let iso = makeIsoDate(year, month, deadline.ruleDay);
      if (deadline.augustSuspension) iso = applyAugustSuspension(iso);
      occurrences.push({ date: nextBusinessDayIso(iso), isOverridden: false, isMissing: false });
    }
    return occurrences;
  }

  if (deadline.ruleType === "ANNUAL_DATE") {
    if (deadline.ruleDay == null || deadline.ruleMonth == null) return [];
    let iso = makeIsoDate(year, deadline.ruleMonth, deadline.ruleDay);
    if (deadline.augustSuspension) iso = applyAugustSuspension(iso);
    return [{ date: nextBusinessDayIso(iso), isOverridden: false, isMissing: false }];
  }

  if (deadline.ruleType === "DAYS_AFTER_YEAR_END") {
    if (deadline.ruleDaysAfterYearEnd == null) return [];
    // Esercizio generico = anno civile: chiusura al 31/12 dell'anno precedente.
    const yearEnd = new Date(Date.UTC(year - 1, 11, 31));
    const target = new Date(yearEnd.getTime());
    target.setUTCDate(target.getUTCDate() + deadline.ruleDaysAfterYearEnd);
    const iso = target.toISOString().slice(0, 10);
    return [{ date: nextBusinessDayIso(iso), isOverridden: false, isMissing: false }];
  }

  return [];
}

export type DeadlineForDisplay = {
  deadline: FiscalDeadline;
  occurrences: DeadlineOccurrence[];
};

// Espande un elenco di scadenze in singole righe (data, scadenza) ordinate
// cronologicamente, per la visualizzazione nel calendario dell'anno.
export function flattenAndSort(
  items: DeadlineForDisplay[]
): { deadline: FiscalDeadline; occurrence: DeadlineOccurrence }[] {
  const rows: { deadline: FiscalDeadline; occurrence: DeadlineOccurrence }[] = [];
  for (const item of items) {
    for (const occurrence of item.occurrences) {
      rows.push({ deadline: item.deadline, occurrence });
    }
  }
  rows.sort((a, b) => {
    if (a.occurrence.isMissing && !b.occurrence.isMissing) return 1;
    if (!a.occurrence.isMissing && b.occurrence.isMissing) return -1;
    return a.occurrence.date.localeCompare(b.occurrence.date);
  });
  return rows;
}
