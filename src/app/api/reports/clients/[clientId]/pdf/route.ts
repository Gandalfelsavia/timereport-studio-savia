import { NextRequest } from "next/server";
import PDFDocument from "pdfkit";
import { auth } from "@/auth";
import { getClientReport } from "@/lib/queries";
import { entryFeeAmount, entryExpenseAmount } from "@/lib/billing";
import { formatCurrency, formatDate, formatHours } from "@/lib/format";

type Column = { header: string; width: number; align?: "left" | "right" };

const PAGE_MARGIN = 40;
const ROW_PADDING = 4;

function drawTableHeader(doc: PDFKit.PDFDocument, x: number, y: number, columns: Column[]) {
  doc.font("Helvetica-Bold").fontSize(8).fillColor("#475569");
  let cx = x;
  for (const col of columns) {
    doc.text(col.header, cx, y, { width: col.width, align: col.align ?? "left" });
    cx += col.width;
  }
  doc.moveTo(x, y + 12).lineTo(cx, y + 12).strokeColor("#cbd5e1").lineWidth(0.5).stroke();
}

// Disegna una tabella semplice con interruzione di pagina automatica.
function drawTable(
  doc: PDFKit.PDFDocument,
  columns: Column[],
  rows: string[][],
  startY: number
): number {
  const x = PAGE_MARGIN;
  const bottomLimit = doc.page.height - PAGE_MARGIN;
  let y = startY;

  drawTableHeader(doc, x, y, columns);
  y += 16;

  doc.font("Helvetica").fontSize(8).fillColor("#0f172a");
  for (const row of rows) {
    const rowHeight =
      Math.max(
        ...row.map((cell, i) => doc.heightOfString(cell, { width: columns[i].width }))
      ) + ROW_PADDING;

    if (y + rowHeight > bottomLimit) {
      doc.addPage();
      y = PAGE_MARGIN;
      drawTableHeader(doc, x, y, columns);
      y += 16;
      doc.font("Helvetica").fontSize(8).fillColor("#0f172a");
    }

    let cx = x;
    row.forEach((cell, i) => {
      doc.text(cell, cx, y, { width: columns[i].width, align: columns[i].align ?? "left" });
      cx += columns[i].width;
    });
    y += rowHeight;
  }
  return y;
}

export async function GET(req: NextRequest, ctx: RouteContext<"/api/reports/clients/[clientId]/pdf">) {
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

  const rate = report.client.hourlyRate ?? 0;

  const doc = new PDFDocument({ margin: PAGE_MARGIN, size: "A4" });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  // Intestazione
  doc.font("Helvetica-Bold").fontSize(16).fillColor("#0f172a").text("Studio Savia", PAGE_MARGIN, PAGE_MARGIN);
  doc.font("Helvetica").fontSize(10).fillColor("#64748b").text("Report attività cliente", PAGE_MARGIN, PAGE_MARGIN + 20);

  doc.font("Helvetica-Bold").fontSize(13).fillColor("#0f172a").text(report.client.name, PAGE_MARGIN, PAGE_MARGIN + 42);
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#64748b")
    .text(`Periodo dal ${formatDate(from)} al ${formatDate(to)}`, PAGE_MARGIN, PAGE_MARGIN + 60);

  // Riepilogo
  let y = PAGE_MARGIN + 84;
  doc.font("Helvetica").fontSize(9).fillColor("#0f172a");
  doc.text(`Ore da fatturare: ${formatHours(report.billableHours)}`, PAGE_MARGIN, y);
  doc.text(`Ore incluse nel forfait: ${formatHours(report.forfaitHours)}`, PAGE_MARGIN, y + 14);
  doc
    .font("Helvetica-Bold")
    .text(`Totale da addebitare: ${formatCurrency(report.amountToInvoice)}`, PAGE_MARGIN, y + 28);
  if (report.expensesAmount > 0) {
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor("#64748b")
      .text(
        `di cui ${formatCurrency(report.feeAmount)} compensi e ${formatCurrency(report.expensesAmount)} spese sostenute`,
        PAGE_MARGIN,
        y + 44
      );
  }

  y += report.expensesAmount > 0 ? 66 : 52;

  // Tabella attività da fatturare
  doc.font("Helvetica-Bold").fontSize(11).fillColor("#0f172a").text("Attività da fatturare", PAGE_MARGIN, y);
  y += 18;

  if (report.billableEntries.length === 0) {
    doc.font("Helvetica").fontSize(9).fillColor("#64748b").text("Nessuna attività in questo periodo.", PAGE_MARGIN, y);
    y += 16;
  } else {
    const columns: Column[] = [
      { header: "Data", width: 55 },
      { header: "Collaboratore", width: 80 },
      { header: "Categoria", width: 70 },
      { header: "Descrizione", width: 140 },
      { header: "Ore", width: 35, align: "right" },
      { header: "Importo", width: 60, align: "right" },
      { header: "Spese", width: 60, align: "right" },
    ];
    const rows = report.billableEntries.map((e) => [
      formatDate(e.date),
      e.userName,
      e.categoryName,
      e.description,
      formatHours(e.hours),
      formatCurrency(entryFeeAmount(e, rate)),
      (e.expenseAmount ?? 0) > 0 ? formatCurrency(entryExpenseAmount(e)) : "—",
    ]);
    y = drawTable(doc, columns, rows, y);
  }

  y += 20;
  if (y > doc.page.height - PAGE_MARGIN - 60) {
    doc.addPage();
    y = PAGE_MARGIN;
  }

  // Tabella attività forfait
  doc.font("Helvetica-Bold").fontSize(11).fillColor("#0f172a").text("Attività incluse nel forfait", PAGE_MARGIN, y);
  y += 18;

  if (report.forfaitEntries.length === 0) {
    doc.font("Helvetica").fontSize(9).fillColor("#64748b").text("Nessuna attività in questo periodo.", PAGE_MARGIN, y);
  } else {
    const columns: Column[] = [
      { header: "Data", width: 60 },
      { header: "Collaboratore", width: 100 },
      { header: "Categoria", width: 90 },
      { header: "Descrizione", width: 185 },
      { header: "Ore", width: 50, align: "right" },
    ];
    const rows = report.forfaitEntries.map((e) => [
      formatDate(e.date),
      e.userName,
      e.categoryName,
      e.description,
      formatHours(e.hours),
    ]);
    drawTable(doc, columns, rows, y);
  }

  doc.end();
  const pdfBuffer = await done;
  const filename = `report_${report.client.name.replace(/[^a-z0-9]+/gi, "_")}_${from}_${to}.pdf`;

  return new Response(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
