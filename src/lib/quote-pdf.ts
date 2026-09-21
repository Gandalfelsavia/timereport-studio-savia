import path from "node:path";
import fs from "node:fs";
import PDFDocument from "pdfkit";
import type { getQuoteWithLines } from "@/lib/queries";
import { computeQuoteTotals, lineAnnualAmount, periodicityLabels } from "@/lib/quotes";
import { quoteFamilyLabels } from "@/lib/quote-templates";
import { formatCurrency, formatDate } from "@/lib/format";

const PAGE_MARGIN = 48;

const COLOR = {
  heading: "#1e293b",
  body: "#334155",
  muted: "#64748b",
  border: "#94a3b8",
  discount: "#047857",
  rowShade: "#f1f5f9",
};

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

  const contentWidth = doc.page.width - PAGE_MARGIN * 2;

  // --- Intestazione ---
  const logoPath = entity.logoFile ? path.join(process.cwd(), "public", entity.logoFile) : null;
  const hasLogo = logoPath && fs.existsSync(logoPath);

  const headerY = PAGE_MARGIN;
  if (hasLogo) {
    try {
      // "fit" ridimensiona mantenendo le proporzioni originali del logo,
      // evitando di deformarlo entro il riquadro massimo indicato.
      doc.image(logoPath!, PAGE_MARGIN, headerY, { fit: [190, 75] });
    } catch {
      // logo non leggibile: si prosegue senza immagine
    }
  }

  const leftTextX = PAGE_MARGIN;
  const leftTextY = headerY + (hasLogo ? 84 : 0);
  doc.font("Helvetica").fontSize(9.5).fillColor(COLOR.body);
  const addressLines = entity.address.split(" – ");
  let ly = leftTextY;
  for (const line of addressLines) {
    doc.text(line, leftTextX, ly, { width: 280 });
    ly += 13;
  }
  doc.text(`CF/P.IVA ${entity.taxCode}`, leftTextX, ly, { width: 280 });
  ly += 13;
  if (entity.sdiCode) {
    doc.text(`Codice SDI ${entity.sdiCode}`, leftTextX, ly, { width: 280 });
    ly += 13;
  }
  if (entity.pec) {
    doc.text(`PEC ${entity.pec}`, leftTextX, ly, { width: 280 });
    ly += 13;
  }
  if (entity.phone) {
    doc.text(entity.phone, leftTextX, ly, { width: 280 });
    ly += 13;
  }

  // Colonna destra: elenco professionisti con ODCEC (solo entità con roster, es. RSVV)
  let ry = PAGE_MARGIN;
  if (entity.showStaffRoster && staff.length > 0) {
    doc.font("Helvetica").fontSize(9.5).fillColor(COLOR.body);
    for (const member of staff) {
      doc.font("Helvetica-Bold").text(member.fullName, 300, ry, { width: 260, continued: true });
      doc
        .font("Helvetica")
        .text(` – ${member.title}${member.odcecNumber ? ` – ${member.odcecNumber}` : ""}`, { width: 260 });
      ry = doc.y + 3;
    }
  }

  let y = Math.max(ly, ry) + 14;
  doc.moveTo(PAGE_MARGIN, y).lineTo(doc.page.width - PAGE_MARGIN, y).strokeColor(COLOR.border).lineWidth(1.2).stroke();
  y += 26;

  // --- Destinatario ---
  doc.font("Helvetica-Bold").fontSize(13).fillColor(COLOR.heading).text(`Spett.le ${quote.recipientName}`, PAGE_MARGIN, y, {
    width: contentWidth,
  });
  y = doc.y + 3;
  if (quote.recipientAddress) {
    doc.font("Helvetica").fontSize(10.5).fillColor(COLOR.body).text(quote.recipientAddress, PAGE_MARGIN, y);
    y = doc.y + 3;
  }
  y += 20;

  // --- Oggetto ---
  const title = quote.title || `Preventivo per nostre prestazioni – ${quoteFamilyLabels[quote.family]}`;
  doc.font("Helvetica-Bold").fontSize(15).fillColor(COLOR.heading).text(title.toUpperCase(), PAGE_MARGIN, y, {
    width: contentWidth,
  });
  y = doc.y + 22;

  // --- Corpo: voci ---
  for (const [i, line] of lines.entries()) {
    // Calcola l'altezza della riga prima di disegnarla, per poter mettere
    // uno sfondo leggero alternato (più leggibile su elenchi lunghi).
    const rightLabel =
      quote.pricingMode === "ITEMIZED"
        ? `${line.amount != null ? formatCurrency(line.amount) : "da stimare"} — ${periodicityLabels[line.periodicity]}`
        : "";
    doc.font("Helvetica-Bold").fontSize(10.5);
    const descWidth = contentWidth - (rightLabel ? 170 : 0);
    const descHeight = doc.heightOfString(line.description, { width: descWidth });
    doc.font("Helvetica").fontSize(9.5);
    const detailHeight = line.detail ? doc.heightOfString(line.detail, { width: contentWidth }) + 6 : 0;
    const rowHeight = Math.max(descHeight, 14) + detailHeight + 14;

    y = ensurePage(doc, y, rowHeight + 10);
    if (quote.pricingMode === "ITEMIZED" && i % 2 === 1) {
      doc.rect(PAGE_MARGIN - 6, y - 4, contentWidth + 12, rowHeight).fill(COLOR.rowShade);
    }

    doc.font("Helvetica-Bold").fontSize(10.5).fillColor(COLOR.heading);
    doc.text(line.description, PAGE_MARGIN, y, { width: descWidth });
    if (rightLabel) {
      doc
        .font("Helvetica")
        .fontSize(10.5)
        .fillColor(COLOR.body)
        .text(rightLabel, doc.page.width - PAGE_MARGIN - 160, y, { width: 160, align: "right" });
    }
    y += descHeight + 4;
    if (line.detail) {
      doc.font("Helvetica-Oblique").fontSize(9.5).fillColor(COLOR.muted).text(line.detail, PAGE_MARGIN, y, { width: contentWidth });
      y = doc.y + 4;
    }
    y += 12;
  }

  y += 12;
  y = ensurePage(doc, y, 140);

  // --- Riepilogo ---
  doc.font("Helvetica-Bold").fontSize(14).fillColor(COLOR.heading).text("Previsione Gestione", PAGE_MARGIN, y);
  y = doc.y + 8;
  doc
    .font("Helvetica-Oblique")
    .fontSize(9.5)
    .fillColor(COLOR.muted)
    .text("Voci previste a titolo informativo, ogni attività può richiedere attività supplementari.", PAGE_MARGIN, y, {
      width: contentWidth,
    });
  y = doc.y + 14;

  if (quote.pricingMode === "ITEMIZED") {
    for (const line of lines.filter((l) => l.periodicity !== "UNA_TANTUM" && l.amount != null)) {
      y = ensurePage(doc, y, 22);
      const annual = lineAnnualAmount(line);
      doc.font("Helvetica").fontSize(10.5).fillColor(COLOR.body).text(line.description, PAGE_MARGIN, y, {
        width: contentWidth - 110,
      });
      doc.text(formatCurrency(annual), doc.page.width - PAGE_MARGIN - 110, y, { width: 110, align: "right" });
      y = doc.y + 6;
    }
    if (totals.unaTantumTotal > 0) {
      y = ensurePage(doc, y, 22);
      doc
        .font("Helvetica")
        .fontSize(10.5)
        .fillColor(COLOR.body)
        .text("Voci una tantum (escluse dal totale ricorrente)", PAGE_MARGIN, y, { width: contentWidth - 110 });
      doc.text(formatCurrency(totals.unaTantumTotal), doc.page.width - PAGE_MARGIN - 110, y, {
        width: 110,
        align: "right",
      });
      y = doc.y + 6;
    }
    y += 6;
  }

  // Riquadro evidenziato per i due totali principali
  y = ensurePage(doc, y, 70);
  doc.rect(PAGE_MARGIN - 8, y - 6, contentWidth + 16, 56).fill(COLOR.rowShade);
  doc
    .font("Helvetica-Bold")
    .fontSize(12.5)
    .fillColor(COLOR.heading)
    .text(`Totale Annuo Previsto${totals.unaTantumTotal > 0 ? " escluso start up" : ""}`, PAGE_MARGIN, y, {
      width: contentWidth - 130,
    });
  doc.text(`${formatCurrency(totals.annualTotal)} + IVA`, doc.page.width - PAGE_MARGIN - 130, y, {
    width: 130,
    align: "right",
  });
  y += 26;
  doc.font("Helvetica-Bold").fontSize(12.5).text("Totale Trimestrale Previsto", PAGE_MARGIN, y, { width: contentWidth - 130 });
  doc.text(`${formatCurrency(totals.quarterlyTotal)} + IVA`, doc.page.width - PAGE_MARGIN - 130, y, {
    width: 130,
    align: "right",
  });
  y += 34;

  if (quote.discountEnabled) {
    y = ensurePage(doc, y, 60);
    doc
      .font("Helvetica-Bold")
      .fontSize(12.5)
      .fillColor(COLOR.discount)
      .text(quote.discountLabel || "Totale con sconto", PAGE_MARGIN, y, { width: contentWidth - 130 });
    doc.text(`${formatCurrency(totals.discountedAnnualTotal)} + IVA`, doc.page.width - PAGE_MARGIN - 130, y, {
      width: 130,
      align: "right",
    });
    y += 20;
    doc.text("Totale Trimestrale con sconto", PAGE_MARGIN, y, { width: contentWidth - 130 });
    doc.text(`${formatCurrency(totals.discountedQuarterlyTotal)} + IVA`, doc.page.width - PAGE_MARGIN - 130, y, {
      width: 130,
      align: "right",
    });
    y += 26;
  }

  // --- Note e condizioni ---
  y = ensurePage(doc, y, 110);
  doc
    .font("Helvetica")
    .fontSize(9.5)
    .fillColor(COLOR.muted)
    .text(
      "Restano escluse dal preventivo le indennità per il deposito di atti al Registro delle Imprese. Resta esclusa consulenza su operazioni straordinarie, o su materie qui non indicate.",
      PAGE_MARGIN,
      y,
      { width: contentWidth }
    );
  y = doc.y + 8;
  doc.text(
    `Dal 1° gennaio 2027 saranno aggiornati con l'indice ISTAT del costo della vita.${
      entity.insuranceNote ? ` ${entity.insuranceNote}` : ""
    }`,
    PAGE_MARGIN,
    y,
    { width: contentWidth }
  );
  y = doc.y + 8;
  doc.text(
    `Gli importi come sopra determinati, che si intendono al netto di IVA${
      entity.appliesRitenutaCp ? " e CP 4%" : ""
    }, verranno addebitati in rate trimestrali, da versare in via anticipata.`,
    PAGE_MARGIN,
    y,
    { width: contentWidth }
  );
  y = doc.y + 36;

  // --- Firma ---
  y = ensurePage(doc, y, 60);
  doc.font("Helvetica").fontSize(10.5).fillColor(COLOR.body).text(`${formatDate(quote.quoteDate)}`, PAGE_MARGIN, y);
  doc.text("Per accettazione", doc.page.width - PAGE_MARGIN - 200, y, { width: 200, align: "right" });

  doc.end();
  return done;
}
