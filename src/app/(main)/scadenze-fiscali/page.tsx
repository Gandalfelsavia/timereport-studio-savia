import { auth } from "@/auth";
import { getFiscalDeadlinesForYear, deadlinesNeedingAttention, getAllFiscalDeadlineRules } from "@/lib/queries";
import { flattenAndSort } from "@/lib/fiscal-deadlines";
import { ScadenzeFiscaliClient } from "./scadenze-client";

export default async function ScadenzeFiscaliPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const sp = await searchParams;
  const currentYear = new Date().getFullYear();
  const year = sp.year ? Number(sp.year) : currentYear;

  const session = await auth();
  const canManage = session?.user?.role === "ADMIN" || session?.user?.role === "SUPERVISOR";

  const items = await getFiscalDeadlinesForYear(year);
  const rows = flattenAndSort(items);
  const pending = canManage ? deadlinesNeedingAttention(items) : [];
  const allDeadlines = canManage ? await getAllFiscalDeadlineRules() : [];

  // Per mostrare "mese corrente + mese successivo" anche a dicembre (dove il
  // mese successivo cade nell'anno dopo), carichiamo anche le scadenze
  // dell'anno successivo: servono solo per la vista predefinita lato client.
  const itemsNextYear = await getFiscalDeadlinesForYear(year + 1);
  const extendedRows = flattenAndSort([...items, ...itemsNextYear]);

  return (
    <ScadenzeFiscaliClient
      year={year}
      rows={rows}
      extendedRows={extendedRows}
      pending={pending}
      canManage={canManage}
      allDeadlines={allDeadlines}
    />
  );
}
