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

  return (
    <ScadenzeFiscaliClient
      year={year}
      rows={rows}
      pending={pending}
      canManage={canManage}
      allDeadlines={allDeadlines}
    />
  );
}
