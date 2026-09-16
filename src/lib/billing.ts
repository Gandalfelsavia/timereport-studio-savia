// Calcolo dell'importo da fatturare per una singola attività.
//
// - Se è impostato un importo manuale ("importo da fatturare"), quello SOSTITUISCE
//   il calcolo automatico ore × tariffa oraria del cliente.
// - Il costo sostenuto (bolli, diritti CCIAA, ecc.) si somma sempre a parte, ed è
//   riaddebitato solo per le attività marcate "da fatturare extra".
export function entryFeeAmount(
  entry: { hours: number; billingAmount?: number | null },
  rate: number
): number {
  return entry.billingAmount ?? entry.hours * rate;
}

export function entryExpenseAmount(entry: { expenseAmount?: number | null }): number {
  return entry.expenseAmount ?? 0;
}

// Importo totale da addebitare per un'attività da fatturare extra (compenso + spese).
export function entryTotalAmount(
  entry: { hours: number; billingAmount?: number | null; expenseAmount?: number | null },
  rate: number
): number {
  return entryFeeAmount(entry, rate) + entryExpenseAmount(entry);
}
