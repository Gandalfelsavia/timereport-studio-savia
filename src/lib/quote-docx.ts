import path from "node:path";
import fs from "node:fs";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  TabStopType,
  BorderStyle,
  ImageRun,
} from "docx";
import type { QuoteWithLinesData } from "@/lib/quote-pdf";
import { computeQuoteTotals, lineAnnualAmount, periodicityLabels } from "@/lib/quotes";
import { quoteFamilyLabels } from "@/lib/quote-templates";
import { formatCurrency, formatDate } from "@/lib/format";

// Pagina A4 con margini di 1 pollice (1440 twips = 1"). Il tab stop a destra
// è posizionato al bordo dell'area di stampa così un TextRun con "\t" prima
// dell'importo si allinea sempre a destra, replicando il layout del PDF.
const PAGE_WIDTH_TWIPS = 11906;
const MARGIN_TWIPS = 1440;
const CONTENT_WIDTH_TWIPS = PAGE_WIDTH_TWIPS - MARGIN_TWIPS * 2;

function amountLine(label: string, value: string, opts?: { bold?: boolean; color?: string }) {
  return new Paragraph({
    tabStops: [{ type: TabStopType.RIGHT, position: CONTENT_WIDTH_TWIPS }],
    spacing: { after: 60 },
    children: [
      new TextRun({ text: label, bold: opts?.bold, color: opts?.color }),
      new TextRun({ text: `\t${value}`, bold: opts?.bold, color: opts?.color }),
    ],
  });
}

function loadLogoImage(logoFile: string | null): { data: Buffer; type: "png" | "jpg" } | null {
  if (!logoFile) return null;
  const filePath = path.join(process.cwd(), "public", logoFile);
  if (!fs.existsSync(filePath)) return null;
  const ext = path.extname(filePath).toLowerCase();
  const type = ext === ".jpg" || ext === ".jpeg" ? "jpg" : "png";
  return { data: fs.readFileSync(filePath), type };
}

export async function generateQuoteDocx(data: QuoteWithLinesData): Promise<Buffer> {
  const { quote, entity, staff, lines } = data;
  if (!entity) throw new Error("Preventivo senza entità emittente valida.");
  const totals = computeQuoteTotals(quote, lines);

  const children: Paragraph[] = [];

  // --- Intestazione ---
  const logo = loadLogoImage(entity.logoFile);
  if (logo) {
    children.push(
      new Paragraph({
        children: [
          new ImageRun({
            type: logo.type,
            data: logo.data,
            transformation: { width: 160, height: 60 },
          }),
        ],
      })
    );
  }

  for (const line of entity.address.split(" – ")) {
    children.push(new Paragraph({ children: [new TextRun({ text: line, size: 16, color: "334155" })] }));
  }
  children.push(new Paragraph({ children: [new TextRun({ text: `CF/P.IVA ${entity.taxCode}`, size: 16, color: "334155" })] }));
  if (entity.sdiCode) {
    children.push(new Paragraph({ children: [new TextRun({ text: `Codice SDI ${entity.sdiCode}`, size: 16, color: "334155" })] }));
  }
  if (entity.pec) {
    children.push(new Paragraph({ children: [new TextRun({ text: `PEC ${entity.pec}`, size: 16, color: "334155" })] }));
  }
  if (entity.phone) {
    children.push(new Paragraph({ children: [new TextRun({ text: entity.phone, size: 16, color: "334155" })] }));
  }

  if (entity.showStaffRoster && staff.length > 0) {
    children.push(new Paragraph({ text: "", spacing: { after: 60 } }));
    for (const member of staff) {
      children.push(
        new Paragraph({
          spacing: { after: 20 },
          children: [
            new TextRun({ text: member.fullName, bold: true, size: 16, color: "334155" }),
            new TextRun({
              text: ` – ${member.title}${member.odcecNumber ? ` – ${member.odcecNumber}` : ""}`,
              size: 16,
              color: "334155",
            }),
          ],
        })
      );
    }
  }

  children.push(
    new Paragraph({
      spacing: { before: 200, after: 200 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "CBD5E1" } },
      children: [],
    })
  );

  // --- Destinatario ---
  children.push(
    new Paragraph({
      spacing: { after: 40 },
      children: [new TextRun({ text: `Spett.le ${quote.recipientName}`, bold: true, size: 20 })],
    })
  );
  if (quote.recipientAddress) {
    children.push(
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ text: quote.recipientAddress, size: 18, color: "334155" })],
      })
    );
  } else {
    children.push(new Paragraph({ text: "", spacing: { after: 200 } }));
  }

  // --- Oggetto ---
  const title = quote.title || `Preventivo per nostre prestazioni – ${quoteFamilyLabels[quote.family]}`;
  children.push(
    new Paragraph({
      spacing: { after: 240 },
      children: [new TextRun({ text: title.toUpperCase(), bold: true, size: 22 })],
    })
  );

  // --- Corpo: voci ---
  for (const line of lines) {
    const rightLabel =
      quote.pricingMode === "ITEMIZED"
        ? `${line.amount != null ? formatCurrency(line.amount) : "da stimare"} — ${periodicityLabels[line.periodicity]}`
        : "";
    children.push(amountLine(line.description, rightLabel, { bold: true }));
    if (line.detail) {
      children.push(
        new Paragraph({
          spacing: { after: 160 },
          children: [new TextRun({ text: line.detail, size: 16, color: "64748B" })],
        })
      );
    }
  }

  // --- Riepilogo ---
  children.push(
    new Paragraph({
      spacing: { before: 200, after: 80 },
      children: [new TextRun({ text: "Previsione Gestione", bold: true, size: 22 })],
    })
  );
  children.push(
    new Paragraph({
      spacing: { after: 160 },
      children: [
        new TextRun({
          text: "Voci previste a titolo informativo, ogni attività può richiedere attività supplementari.",
          size: 16,
          color: "64748B",
        }),
      ],
    })
  );

  if (quote.pricingMode === "ITEMIZED") {
    for (const line of lines.filter((l) => l.periodicity !== "UNA_TANTUM" && l.amount != null)) {
      children.push(amountLine(line.description, formatCurrency(lineAnnualAmount(line))));
    }
    if (totals.unaTantumTotal > 0) {
      children.push(
        amountLine("Voci una tantum (escluse dal totale ricorrente)", formatCurrency(totals.unaTantumTotal))
      );
    }
  }

  children.push(
    amountLine(
      `Totale Annuo Previsto${totals.unaTantumTotal > 0 ? " escluso start up" : ""}`,
      `${formatCurrency(totals.annualTotal)} + IVA`,
      { bold: true }
    )
  );
  children.push(amountLine("Totale Trimestrale Previsto", `${formatCurrency(totals.quarterlyTotal)} + IVA`, { bold: true }));

  if (quote.discountEnabled) {
    children.push(
      amountLine(quote.discountLabel || "Totale con sconto", `${formatCurrency(totals.discountedAnnualTotal)} + IVA`, {
        bold: true,
        color: "047857",
      })
    );
    children.push(
      amountLine("Totale Trimestrale con sconto", `${formatCurrency(totals.discountedQuarterlyTotal)} + IVA`, {
        bold: true,
        color: "047857",
      })
    );
  }

  // --- Note e condizioni ---
  children.push(
    new Paragraph({
      spacing: { before: 200, after: 100 },
      children: [
        new TextRun({
          text: "Restano escluse dal preventivo le indennità per il deposito di atti al Registro delle Imprese. Resta esclusa consulenza su operazioni straordinarie, o su materie qui non indicate.",
          size: 16,
          color: "64748B",
        }),
      ],
    })
  );
  children.push(
    new Paragraph({
      spacing: { after: 100 },
      children: [
        new TextRun({
          text: `Dal 1° gennaio 2027 saranno aggiornati con l'indice ISTAT del costo della vita.${
            entity.insuranceNote ? ` ${entity.insuranceNote}` : ""
          }`,
          size: 16,
          color: "64748B",
        }),
      ],
    })
  );
  children.push(
    new Paragraph({
      spacing: { after: 400 },
      children: [
        new TextRun({
          text: `Gli importi come sopra determinati, che si intendono al netto di IVA${
            entity.appliesRitenutaCp ? " e CP 4%" : ""
          }, verranno addebitati in rate trimestrali, da versare in via anticipata.`,
          size: 16,
          color: "64748B",
        }),
      ],
    })
  );

  // --- Firma ---
  children.push(
    new Paragraph({
      tabStops: [{ type: TabStopType.RIGHT, position: CONTENT_WIDTH_TWIPS }],
      children: [
        new TextRun({ text: formatDate(quote.quoteDate), size: 18 }),
        new TextRun({ text: "\tPer accettazione", size: 18 }),
      ],
    })
  );

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: PAGE_WIDTH_TWIPS, height: 16838 },
            margin: { top: MARGIN_TWIPS, bottom: MARGIN_TWIPS, left: MARGIN_TWIPS, right: MARGIN_TWIPS },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}
