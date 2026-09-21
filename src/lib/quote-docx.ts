import path from "node:path";
import fs from "node:fs";
import { imageSize } from "image-size";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  TabStopType,
  BorderStyle,
  ImageRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  VerticalAlign,
  ShadingType,
} from "docx";
import type { QuoteWithLinesData } from "@/lib/quote-pdf";
import { computeQuoteTotals, lineAnnualAmount, periodicityLabels } from "@/lib/quotes";
import { quoteFamilyLabels } from "@/lib/quote-templates";
import { formatCurrency, formatDate } from "@/lib/format";
import { fitDimensions } from "@/lib/image-fit";

// Pagina A4 con margini di 1,1 pollice. I colori ricalcano la palette già
// usata nell'app (slate + verde per lo sconto), per coerenza visiva.
const PAGE_WIDTH_TWIPS = 11906;
const PAGE_HEIGHT_TWIPS = 16838;
const MARGIN_TWIPS = 1300;
const CONTENT_WIDTH_TWIPS = PAGE_WIDTH_TWIPS - MARGIN_TWIPS * 2;
const COL_DESCRIPTION_TWIPS = Math.round(CONTENT_WIDTH_TWIPS * 0.68);
const COL_AMOUNT_TWIPS = CONTENT_WIDTH_TWIPS - COL_DESCRIPTION_TWIPS;

const COLOR = {
  heading: "1E293B",
  body: "334155",
  muted: "64748B",
  border: "CBD5E1",
  discount: "047857",
  rowShade: "F8FAFC",
};

const NO_BORDER = {
  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
};

function cell(
  children: Paragraph[],
  opts: { width: number; shaded?: boolean; topBorder?: boolean }
): TableCell {
  return new TableCell({
    children,
    width: { size: opts.width, type: WidthType.DXA },
    borders: opts.topBorder
      ? { ...NO_BORDER, top: { style: BorderStyle.SINGLE, size: 6, color: COLOR.border } }
      : NO_BORDER,
    shading: opts.shaded ? { type: ShadingType.CLEAR, fill: COLOR.rowShade, color: "auto" } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 80, bottom: 80, left: 60, right: 60 },
  });
}

// Riga a due colonne (descrizione a sinistra, importo/periodicità a destra)
// usata sia per il corpo del preventivo sia per il riepilogo: una tabella
// senza bordi visibili garantisce un allineamento pulito anche quando la
// descrizione va a capo su più righe, cosa che i tab-stop non gestiscono bene.
function twoColRow(
  left: Paragraph[],
  right: Paragraph[],
  opts: { shaded?: boolean; topBorder?: boolean } = {}
): TableRow {
  return new TableRow({
    children: [
      cell(left, { width: COL_DESCRIPTION_TWIPS, ...opts }),
      cell(right, { width: COL_AMOUNT_TWIPS, ...opts }),
    ],
  });
}

function borderlessTable(rows: TableRow[]): Table {
  return new Table({
    width: { size: CONTENT_WIDTH_TWIPS, type: WidthType.DXA },
    columnWidths: [COL_DESCRIPTION_TWIPS, COL_AMOUNT_TWIPS],
    rows,
  });
}

function loadLogoImage(
  logoFile: string | null
): { data: Buffer; type: "png" | "jpg"; width: number; height: number } | null {
  if (!logoFile) return null;
  const filePath = path.join(process.cwd(), "public", logoFile);
  if (!fs.existsSync(filePath)) return null;
  const ext = path.extname(filePath).toLowerCase();
  const type = ext === ".jpg" || ext === ".jpeg" ? "jpg" : "png";
  const data = fs.readFileSync(filePath);
  try {
    const dims = imageSize(data);
    return { data, type, width: dims.width, height: dims.height };
  } catch {
    return { data, type, width: 160, height: 60 };
  }
}

export async function generateQuoteDocx(data: QuoteWithLinesData): Promise<Buffer> {
  const { quote, entity, staff, lines } = data;
  if (!entity) throw new Error("Preventivo senza entità emittente valida.");
  const totals = computeQuoteTotals(quote, lines);

  const children: (Paragraph | Table)[] = [];

  // --- Intestazione ---
  const logo = loadLogoImage(entity.logoFile);
  if (logo) {
    // Riquadro massimo del logo: la larghezza reale si adatta mantenendo le
    // proporzioni originali, per non deformare loghi con forme diverse
    // (es. RSVV molto orizzontale, ABSV più quadrato).
    const { width, height } = fitDimensions(logo.width, logo.height, 210, 85);
    children.push(
      new Paragraph({
        spacing: { after: 120 },
        children: [new ImageRun({ type: logo.type, data: logo.data, transformation: { width, height } })],
      })
    );
  }

  for (const line of entity.address.split(" – ")) {
    children.push(new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: line, size: 19, color: COLOR.body })] }));
  }
  children.push(
    new Paragraph({
      spacing: { after: 20 },
      children: [new TextRun({ text: `CF/P.IVA ${entity.taxCode}`, size: 19, color: COLOR.body })],
    })
  );
  if (entity.sdiCode) {
    children.push(
      new Paragraph({
        spacing: { after: 20 },
        children: [new TextRun({ text: `Codice SDI ${entity.sdiCode}`, size: 19, color: COLOR.body })],
      })
    );
  }
  if (entity.pec) {
    children.push(
      new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: `PEC ${entity.pec}`, size: 19, color: COLOR.body })] })
    );
  }
  if (entity.phone) {
    children.push(new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: entity.phone, size: 19, color: COLOR.body })] }));
  }

  if (entity.showStaffRoster && staff.length > 0) {
    children.push(new Paragraph({ text: "", spacing: { after: 100 } }));
    for (const member of staff) {
      children.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [
            new TextRun({ text: member.fullName, bold: true, size: 19, color: COLOR.body }),
            new TextRun({
              text: ` – ${member.title}${member.odcecNumber ? ` – ${member.odcecNumber}` : ""}`,
              size: 19,
              color: COLOR.body,
            }),
          ],
        })
      );
    }
  }

  children.push(
    new Paragraph({
      spacing: { before: 240, after: 280 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: COLOR.border } },
      children: [],
    })
  );

  // --- Destinatario ---
  children.push(
    new Paragraph({
      spacing: { after: 60 },
      children: [new TextRun({ text: `Spett.le ${quote.recipientName}`, bold: true, size: 26, color: COLOR.heading })],
    })
  );
  if (quote.recipientAddress) {
    children.push(
      new Paragraph({
        spacing: { after: 280 },
        children: [new TextRun({ text: quote.recipientAddress, size: 20, color: COLOR.body })],
      })
    );
  } else {
    children.push(new Paragraph({ text: "", spacing: { after: 280 } }));
  }

  // --- Oggetto ---
  const title = quote.title || `Preventivo per nostre prestazioni – ${quoteFamilyLabels[quote.family]}`;
  children.push(
    new Paragraph({
      spacing: { after: 320 },
      children: [new TextRun({ text: title.toUpperCase(), bold: true, size: 27, color: COLOR.heading })],
    })
  );

  // --- Corpo: voci ---
  if (quote.pricingMode === "ITEMIZED") {
    const rows: TableRow[] = lines.map((line, i) => {
      const rightLabel = `${line.amount != null ? formatCurrency(line.amount) : "da stimare"} — ${periodicityLabels[line.periodicity]}`;
      const leftParas = [
        new Paragraph({
          spacing: { after: line.detail ? 40 : 0 },
          children: [new TextRun({ text: line.description, bold: true, size: 22, color: COLOR.heading })],
        }),
      ];
      if (line.detail) {
        leftParas.push(
          new Paragraph({ children: [new TextRun({ text: line.detail, size: 19, italics: true, color: COLOR.muted })] })
        );
      }
      const rightParas = [
        new Paragraph({ alignment: "right", children: [new TextRun({ text: rightLabel, size: 21, color: COLOR.body })] }),
      ];
      return twoColRow(leftParas, rightParas, { shaded: i % 2 === 1 });
    });
    children.push(borderlessTable(rows));
  } else {
    for (const line of lines) {
      children.push(
        new Paragraph({
          spacing: { after: line.detail ? 40 : 160 },
          bullet: { level: 0 },
          children: [new TextRun({ text: line.description, size: 22, color: COLOR.heading })],
        })
      );
      if (line.detail) {
        children.push(
          new Paragraph({
            indent: { left: 360 },
            spacing: { after: 160 },
            children: [new TextRun({ text: line.detail, size: 19, italics: true, color: COLOR.muted })],
          })
        );
      }
    }
  }

  // --- Riepilogo ---
  children.push(
    new Paragraph({
      spacing: { before: 320, after: 80 },
      children: [new TextRun({ text: "Previsione Gestione", bold: true, size: 26, color: COLOR.heading })],
    })
  );
  children.push(
    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: "Voci previste a titolo informativo, ogni attività può richiedere attività supplementari.",
          size: 19,
          italics: true,
          color: COLOR.muted,
        }),
      ],
    })
  );

  const summaryRows: TableRow[] = [];
  if (quote.pricingMode === "ITEMIZED") {
    for (const line of lines.filter((l) => l.periodicity !== "UNA_TANTUM" && l.amount != null)) {
      summaryRows.push(
        twoColRow(
          [new Paragraph({ children: [new TextRun({ text: line.description, size: 21, color: COLOR.body })] })],
          [
            new Paragraph({
              alignment: "right",
              children: [new TextRun({ text: formatCurrency(lineAnnualAmount(line)), size: 21, color: COLOR.body })],
            }),
          ]
        )
      );
    }
    if (totals.unaTantumTotal > 0) {
      summaryRows.push(
        twoColRow(
          [
            new Paragraph({
              children: [new TextRun({ text: "Voci una tantum (escluse dal totale ricorrente)", size: 21, color: COLOR.body })],
            }),
          ],
          [
            new Paragraph({
              alignment: "right",
              children: [new TextRun({ text: formatCurrency(totals.unaTantumTotal), size: 21, color: COLOR.body })],
            }),
          ]
        )
      );
    }
  }

  summaryRows.push(
    twoColRow(
      [
        new Paragraph({
          children: [
            new TextRun({
              text: `Totale Annuo Previsto${totals.unaTantumTotal > 0 ? " escluso start up" : ""}`,
              bold: true,
              size: 23,
              color: COLOR.heading,
            }),
          ],
        }),
      ],
      [
        new Paragraph({
          alignment: "right",
          children: [new TextRun({ text: `${formatCurrency(totals.annualTotal)} + IVA`, bold: true, size: 23, color: COLOR.heading })],
        }),
      ],
      { shaded: true, topBorder: true }
    )
  );
  summaryRows.push(
    twoColRow(
      [new Paragraph({ children: [new TextRun({ text: "Totale Trimestrale Previsto", bold: true, size: 23, color: COLOR.heading })] })],
      [
        new Paragraph({
          alignment: "right",
          children: [new TextRun({ text: `${formatCurrency(totals.quarterlyTotal)} + IVA`, bold: true, size: 23, color: COLOR.heading })],
        }),
      ],
      { shaded: true }
    )
  );

  if (quote.discountEnabled) {
    summaryRows.push(
      twoColRow(
        [
          new Paragraph({
            children: [new TextRun({ text: quote.discountLabel || "Totale con sconto", bold: true, size: 23, color: COLOR.discount })],
          }),
        ],
        [
          new Paragraph({
            alignment: "right",
            children: [
              new TextRun({ text: `${formatCurrency(totals.discountedAnnualTotal)} + IVA`, bold: true, size: 23, color: COLOR.discount }),
            ],
          }),
        ],
        { topBorder: true }
      )
    );
    summaryRows.push(
      twoColRow(
        [new Paragraph({ children: [new TextRun({ text: "Totale Trimestrale con sconto", bold: true, size: 23, color: COLOR.discount })] })],
        [
          new Paragraph({
            alignment: "right",
            children: [
              new TextRun({ text: `${formatCurrency(totals.discountedQuarterlyTotal)} + IVA`, bold: true, size: 23, color: COLOR.discount }),
            ],
          }),
        ]
      )
    );
  }

  children.push(borderlessTable(summaryRows));

  // --- Note e condizioni ---
  children.push(
    new Paragraph({
      spacing: { before: 320, after: 120 },
      children: [
        new TextRun({
          text: "Restano escluse dal preventivo le indennità per il deposito di atti al Registro delle Imprese. Resta esclusa consulenza su operazioni straordinarie, o su materie qui non indicate.",
          size: 18,
          color: COLOR.muted,
        }),
      ],
    })
  );
  children.push(
    new Paragraph({
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: `Dal 1° gennaio 2027 saranno aggiornati con l'indice ISTAT del costo della vita.${
            entity.insuranceNote ? ` ${entity.insuranceNote}` : ""
          }`,
          size: 18,
          color: COLOR.muted,
        }),
      ],
    })
  );
  children.push(
    new Paragraph({
      spacing: { after: 480 },
      children: [
        new TextRun({
          text: `Gli importi come sopra determinati, che si intendono al netto di IVA${
            entity.appliesRitenutaCp ? " e CP 4%" : ""
          }, verranno addebitati in rate trimestrali, da versare in via anticipata.`,
          size: 18,
          color: COLOR.muted,
        }),
      ],
    })
  );

  // --- Firma ---
  children.push(
    new Paragraph({
      tabStops: [{ type: TabStopType.RIGHT, position: CONTENT_WIDTH_TWIPS }],
      children: [
        new TextRun({ text: formatDate(quote.quoteDate), size: 21, color: COLOR.body }),
        new TextRun({ text: "\tPer accettazione", size: 21, color: COLOR.body }),
      ],
    })
  );

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: 22, color: COLOR.body },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: PAGE_WIDTH_TWIPS, height: PAGE_HEIGHT_TWIPS },
            margin: { top: MARGIN_TWIPS, bottom: MARGIN_TWIPS, left: MARGIN_TWIPS, right: MARGIN_TWIPS },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}
