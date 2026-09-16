import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { getClientReport } from "@/lib/queries";
import { formatDate } from "@/lib/format";

function csvEscape(value: string): string {
  if (/[",\n;]/.test(value)) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}

export async function GET(req: NextRequest, ctx: RouteContext<"/api/reports/clients/[clientId]/csv">) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPERVISOR")) {
    return new Response("Non autorizzato", { status: 403 });
  }

  const { clientId } = await ctx.params;
  const { searchParams } = req.nextUrl;
  const today = new Date().toISOString().slice(0, 10);
  const from = searchParams.get("from") || today;
  const to = searchParams.get("to") || today;

  const report = await getClientReport(clientId, from, to);
  if (!report) return new Response("Cliente non trovato", { status: 404 });

  const rows: string[] = [];
  rows.push(["Data", "Collaboratore", "Categoria", "Descrizione", "Ore", "Tipo", "Importo"].join(";"));

  const rate = report.client.hourlyRate ?? 0;
  for (const e of report.billableEntries) {
    rows.push(
      [
        formatDate(e.date),
        csvEscape(e.userName),
        csvEscape(e.categoryName),
        csvEscape(e.description),
        e.hours.toString().replace(".", ","),
        "Da fatturare",
        (e.hours * rate).toFixed(2).replace(".", ","),
      ].join(";")
    );
  }
  for (const e of report.forfaitEntries) {
    rows.push(
      [
        formatDate(e.date),
        csvEscape(e.userName),
        csvEscape(e.categoryName),
        csvEscape(e.description),
        e.hours.toString().replace(".", ","),
        "Forfait",
        "",
      ].join(";")
    );
  }
  rows.push("");
  rows.push(["", "", "", "", "", "Totale da addebitare", report.amountToInvoice.toFixed(2).replace(".", ",")].join(";"));

  const csv = "﻿" + rows.join("\n");
  const filename = `report_${report.client.name.replace(/[^a-z0-9]+/gi, "_")}_${from}_${to}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
