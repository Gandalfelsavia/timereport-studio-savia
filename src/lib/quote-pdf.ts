import path from "node:path";
import fs from "node:fs";
import PDFDocument from "pdfkit";
import type { getQuoteWithLines } from "@/lib/queries";
import { computeQuoteTotals, lineAnnualAmount, periodicityLabels } from "@/lib/quotes";
import { quoteFamilyLabels } from "@/lib/quote-templates";
import { formatCurrency, formatDate } from "@/lib/format";

const PAGE_MARGIN = 40;

function ensurePage(doc: PDFKit.PDFDocument, y: number, needed = 60): number {
  if (y + needed > doc.page.height - PAGE_MARGIN) {
    doc.addPage();
    return PAGE_MARGIN;
  }
  return y;
}

export type QuoteWithLinesData = NonNullable<Awaited<ReturnType<typeof getQuoteWithLines>>>;

// Genera il PDF del preventivo: intestazione specifica per entità emittente
// (RSVV con roster professionisti/ODCEC, ABSV con intestazione più semplice),
// corpo delle voci (in base a pricingMode), riepilogo (Previsione Gestione),
// eventuale blocco sconto e blocco firma.
export async function generateQuotePdf(data: QuoteWithLinesData): Promise<Buffer> {
  const { quote, entity, staff, lines } = data;
  if (!entity) throw new Error("Preventivo senza entità emittente valida.");
  const totals = computeQuoteTotals(quote, lines);

  const doc = new PDFDocument({ margin: PAGE_MARGIN, size: "A4" });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  // --- Intestazione ---
  const logoPath = entity.logoFile ? path.join(process.cwd(), "public", entity.logoFile) : null;
  const hasLogo = logoPath && fs.existsSync(logoPath);

  const headerY = PAGE_MARGIN;
  if (hasLogo) {
    try {
      doc.image(logoPath!, PAGE_MARGIN, headerY, { fit: [160, 60] });
    } catch {
      // logo non leggibile: si prosegue senza immagine
    }
  }

  const leftTextX = PAGE_MARGIN;
  const leftTextY = headerY + (hasLogo ? 66 : 0);
  doc.font("Helvetica").fontSize(8).fillColor("#334155");
  const addressLines = entity.address.split(" – ");
  let ly = leftTextY;
  for (const line of addressLines) {
    doc.text(line, leftTextX, ly, { width: 260 });
    ly += 11;
  }
  doc.text(`CF/P.IVA ${entity.taxCode}`, leftTextX, ly, { width: 260 });
  ly += 11;
  if (entity.sdiCode) {
    doc.text(`Codice SDI ${entity.sdiCode}`, leftTextX, ly, { width: 260 });
    ly += 11;
  }
  if (entity.pec) {
    doc.text(`PEC ${entity.pec}`, leftTextX, ly, { width: 260 });
    ly += 11;
  }
  if (entity.phone) {
    doc.text(entity.phone, leftTextX, ly, { width: 260 });
    ly += 11;
  }

  // Colonna destra: elenco professionisti con ODCEC (solo entità con roster, es. RSVV)
  let ry = PAGE_MARGIN;
  if (entity.showStaffRoster && staff.length > 0) {
    doc.font("Helvetica").fontSize(8).fillColor("#334155");
    for (const member of staff) {
      doc.font("Helvetica-Bold").text(member.fullName, 300, ry, { width: 255, continued: true });
      doc
        .font("Helvetica")
        .text(` – ${member.title}${member.odcecNumber ? ` – ${member.odcecNumber}` : ""}`, { width: 255 });
      ry = doc.y + 2;
    }
  }

  let y = Math.max(ly, ry) + 10;
  doc.moveTo(PAGE_MARGIN, y).lineTo(doc.page.width - PAGE_MARGIN, y).strokeColor("#cbd5e1").lineWidth(1).stroke();
  y += 20;

  // --- Destinatario ---
  doc.font("Helvetica-Bold").fontSize(10).fillColor("#0f172a").text(`Spett.le ${quote.recipientName}`, PAGE_MARGIN, y, {
    width: doc.page.width - PAGE_MARGIN * 2,
  });
  y = doc.y + 2;
  if (quote.recipientAddress) {
    doc.font("Helvetica").fontSize(9).fillColor("#334155").text(quote.recipientAddress, PAGE_MARGIN, y);
    y = doc.y + 2;
  }
  y += 14;

  // --- Oggetto ---
  const title = quote.title || `Preventivo per nostre prestazioni – ${quoteFamilyLabels[quote.family]}`;
  doc.font("Helvetica-Bold").fontSize(11).fillColor("#0f172a").text(title.toUpperCase(), PAGE_MARGIN, y, {
    width: doc.page.width - PAGE_MARGIN * 2,
  });
  y = doc.y + 16;

  // --- Corpo: voci ---
  const contentWidth = doc.page.width - PAGE_MARGIN * 2;
  for (const line of lines) {
    y = ensurePage(doc, y, 40);
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#0f172a");
    const rightLabel =
      quote.pricingMode === "ITEMIZED"
        ? `${line.amount != null ? formatCurrency(line.amount) : "da stimare"} — ${periodicityLabels[line.periodicity]}`
        : "";
    doc.text(line.description, PAGE_MARGIN, y, { width: contentWidth - (rightLabel ? 160 : 0) });
    if (rightLabel) {
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#334155")
        .text(rightLabel, doc.page.width - PAGE_MARGIN - 150, y, { width: 150, align: "right" });
    }
    y = doc.y + 2;
    if (line.detail) {
      doc.font("Helvetica").fontSize(8).fillColor("#64748b").text(line.detail, PAGE_MARGIN, y, { width: contentWidth });
      y = doc.y + 2;
    }
    y += 6;
  }

  y += 10;
  y = ensurePage(doc, y, 120);

  // --- Riepilogo ---
  doc.font("Helvetica-Bold").fontSize(11).fillColor("#0f172a").text("Previsione Gestione", PAGE_MARGIN, y);
  y = doc.y + 6;
  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor("#64748b")
    .text("Voci previste a titolo informativo, ogni attività può richiedere attività supplementari.", PAGE_MARGIN, y, {
      width: contentWidth,
    });
  y = doc.y + 10;

  if (quote.pricingMode === "ITEMIZED") {
    for (const line of lines.filter((l) => l.periodicity !== "UNA_TANTUM" && l.amount != null)) {
      y = ensurePage(doc, y, 20);
      const annual = lineAnnualAmount(line);
      doc.font("Helvetica").fontSize(9).fillColor("#334155").text(line.description, PAGE_MARGIN, y, {
        width: contentWidth - 100,
      });
      doc.text(formatCurrency(annual), doc.page.width - PAGE_MARGIN - 100, y, { width: 100, align: "right" });
      y = doc.y + 4;
    }
    if (totals.unaTantumTotal > 0) {
      y = ensurePage(doc, y, 20);
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#334155")
        .text("Voci una tantum (escluse dal totale ricorrente)", PAGE_MARGIN, y, { width: contentWidth - 100 });
      doc.text(formatCurrency(totals.unaTantumTotal), doc.page.width - PAGE_MARGIN - 100, y, {
        width: 100,
        align: "right",
      });
      y = doc.y + 4;
    }
    y += 6;
  }

  y = ensurePage(doc, y, 60);
  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor("#0f172a")
    .text(`Totale Annuo Previsto${totals.unaTantumTotal > 0 ? " escluso start up" : ""}`, PAGE_MARGIN, y, {
      width: contentWidth - 120,
      continued: false,
    });
  doc.text(`${formatCurrency(totals.annualTotal)} + IVA`, doc.page.width - PAGE_MARGIN - 120, y, {
    width: 120,
    align: "right",
  });
  y = doc.y + 4;
  doc.font("Helvetica-Bold").fontSize(10).text("Totale Trimestrale Previsto", PAGE_MARGIN, y, { width: contentWidth - 120 });
  doc.text(`${formatCurrency(totals.quarterlyTotal)} + IVA`, doc.page.width - PAGE_MARGIN - 120, y, {
    width: 120,
    align: "right",
  });
  y = doc.y + 14;

  if (quote.discountEnabled) {
    y = ensurePage(doc, y, 60);
    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor("#047857")
      .text(quote.discountLabel || "Totale con sconto", PAGE_MARGIN, y, { width: contentWidth - 120 });
    doc.text(`${formatCurrency(totals.discountedAnnualTotal)} + IVA`, doc.page.width - PAGE_MARGIN - 120, y, {
      width: 120,
      align: "right",
    });
    y = doc.y + 4;
    doc.text("Totale Trimestrale con sconto", PAGE_MARGIN, y, { width: contentWidth - 120 });
    doc.text(`${formatCurrency(totals.discountedQuarterlyTotal)} + IVA`, doc.page.width - PAGE_MARGIN - 120, y, {
      width: 120,
      align: "right",
    });
    y = doc.y + 14;
  }

  // --- Note e condizioni ---
  y = ensurePage(doc, y, 100);
  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor("#64748b")
    .text(
      "Restano escluse dal preventivo le indennità per il deposito di atti al Registro delle Imprese. Resta esclusa consulenza su operazioni straordinarie, o su materie qui non indicate.",
      PAGE_MARGIN,
      y,
      { width: contentWidth }
    );
  y = doc.y + 6;
  doc.text(
    `Dal 1° gennaio 2027 saranno aggiornati con l'indice ISTAT del costo della vita.${
      entity.insuranceNote ? ` ${entity.insuranceNote}` : ""
    }`,
    PAGE_MARGIN,
    y,
    { width: contentWidth }
  );
  y = doc.y + 6;
  doc.text(
    `Gli importi come sopra determinati, che si intendono al netto di IVA${
      entity.appliesRitenutaCp ? " e CP 4%" : ""
    }, verranno addebitati in rate trimestrali, da versare in via anticipata.`,
    PAGE_MARGIN,
    y,
    { width: contentWidth }
  );
  y = doc.y + 30;

  // --- Firma ---
  y = ensurePage(doc, y, 60);
  doc.font("Helvetica").fontSize(9).fillColor("#0f172a").text(`${formatDate(quote.quoteDate)}`, PAGE_MARGIN, y);
  doc.text("Per accettazione", doc.page.width - PAGE_MARGIN - 200, y, { width: 200, align: "right" });

  doc.end();
  return done;
}
