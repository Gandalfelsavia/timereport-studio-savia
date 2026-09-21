import type { Quote, QuoteLine } from "@/db/schema";

export const quoteFamilyLabels: Record<Quote["family"], string> = {
  SOCIETA: "Società (SRL)",
  RAPPRESENTANZA_FISCALE: "Identificazione diretta / Rappresentanza fiscale",
  ETS_ASD: "ETS / ASD",
  DITTA_INDIVIDUALE: "Ditta individuale",
  FORFETTARIO: "Forfettario",
};

export const quoteFamilyPricingMode: Record<Quote["family"], Quote["pricingMode"]> = {
  SOCIETA: "ITEMIZED",
  RAPPRESENTANZA_FISCALE: "ITEMIZED",
  ETS_ASD: "FLAT",
  DITTA_INDIVIDUALE: "ITEMIZED",
  FORFETTARIO: "FLAT",
};

export type TemplateLine = Pick<QuoteLine, "description" | "detail" | "tariffSource" | "amount" | "periodicity">;

// Righe di partenza per ciascuna famiglia, ricavate dai preventivi reali che
// lo studio ci ha fornito come esempio. Sono solo un punto di partenza:
// nel composer si possono aggiungere, modificare o eliminare righe liberamente.
export const quoteFamilyTemplates: Record<Quote["family"], TemplateLine[]> = {
  SOCIETA: [
    {
      description: "Start up: costituzione e attivazione SRL",
      detail:
        "Redazione statuto con notaio, definizione oggetto sociale, richiesta CF/P.IVA, attivazione in Camera di Commercio, delega fatturazione elettronica, predisposizione deleghe cassetto fiscale.",
      tariffSource: "LIBERO",
      amount: 1000,
      periodicity: "UNA_TANTUM",
    },
    {
      description: "Gestione contabile (tariffa mensile in base al numero di registrazioni annue)",
      detail:
        "0-100 reg. 160,00; 101-300 reg. 180,00; 301-400 reg. 200,00; 401-600 reg. 220,00; 601-800 reg. 240,00; oltre 1,90/registrazione (importi con liquidazione IVA trimestrale; con liquidazione mensile aggiungere circa 40,00/mese).",
      tariffSource: "LIBERO",
      amount: null,
      periodicity: "MENSILE",
    },
    {
      description: "Redazione bilancio, verbale di assemblea e deposito Registro Imprese",
      detail: "500,00 fino a fatturato 500.000 €; 1.000,00 da 500.001 a 1.000.000 €.",
      tariffSource: "LIBERO",
      amount: 500,
      periodicity: "ANNUALE",
    },
    {
      description: "Liquidazioni IVA trimestrali",
      detail: null,
      tariffSource: "LIBERO",
      amount: 50,
      periodicity: "TRIMESTRALE",
    },
    {
      description: "Dichiarazione IVA annuale",
      detail: null,
      tariffSource: "LIBERO",
      amount: 200,
      periodicity: "ANNUALE",
    },
    {
      description: "Predisposizione dichiarazioni redditi IRES/IRAP e modelli ISA con invio telematico",
      detail: null,
      tariffSource: "LIBERO",
      amount: 500,
      periodicity: "ANNUALE",
    },
    {
      description: "Redazione ed invio Modello 770",
      detail: null,
      tariffSource: "LIBERO",
      amount: 200,
      periodicity: "ANNUALE",
    },
  ],

  RAPPRESENTANZA_FISCALE: [
    {
      description: "Procedura di nomina del rappresentante fiscale",
      detail: null,
      tariffSource: "LIBERO",
      amount: 700,
      periodicity: "UNA_TANTUM",
    },
    {
      description: "Richiesta codice fiscale e apertura partita IVA",
      detail: null,
      tariffSource: "LIBERO",
      amount: 700,
      periodicity: "UNA_TANTUM",
    },
    {
      description: "Registrazione VIES e ricerca polizza assicurativa",
      detail: null,
      tariffSource: "LIBERO",
      amount: 600,
      periodicity: "UNA_TANTUM",
    },
    {
      description: "Gestione fiscale e contabile fino a 100 documenti/anno (inclusa gestione OSS)",
      detail: "Oltre i 100 documenti: 1,90 €/documento eccedente.",
      tariffSource: "LIBERO",
      amount: 900,
      periodicity: "TRIMESTRALE",
    },
    {
      description: "LIPE (liquidazioni periodiche IVA)",
      detail: null,
      tariffSource: "LIBERO",
      amount: 50,
      periodicity: "TRIMESTRALE",
    },
    {
      description: "Dichiarazione IVA",
      detail: null,
      tariffSource: "LIBERO",
      amount: 700,
      periodicity: "ANNUALE",
    },
    {
      description: "Modello Intrastat (cadauno)",
      detail: null,
      tariffSource: "LIBERO",
      amount: 200,
      periodicity: "ANNUALE",
    },
    {
      description: "Compenso variabile per responsabilità solidale su fatturato EU",
      detail:
        "Fino a 500.000 €: +1% (max 5.000). 500.001–1.000.000: +0,85% sulla differenza (max 8.500). 1.000.001–2.500.000: +0,75% (max 11.250). 2.500.001–5.000.000: +0,5% (max 12.500). 5.000.001–10.000.000: +0,30% (max 15.000). Oltre: da stimare.",
      tariffSource: "LIBERO",
      amount: null,
      periodicity: "ANNUALE",
    },
  ],

  DITTA_INDIVIDUALE: [
    {
      description: "Contabilità semplificata: quota fissa mensile in base al volume d'affari",
      detail:
        "0-20.000 €/anno: 40,00; 20.001-50.000: 60,00; 50.001-100.000: 90,00; 100.001-200.000: 110,00.",
      tariffSource: "LIBERO",
      amount: null,
      periodicity: "MENSILE",
    },
    {
      description: "Contabilità semplificata: quota variabile mensile per fatture emesse/ricevute",
      detail:
        "0-120 fatture/anno: 10,00; 121-240: 20,00; 241-360: 40,00; 361-600: 80,00; oltre 600: 80,00 + 1,50/fattura eccedente.",
      tariffSource: "LIBERO",
      amount: null,
      periodicity: "MENSILE",
    },
    {
      description: "Tenuta libro cespiti e calcolo ammortamenti annuali",
      detail: "Fino a 10 cespiti: 50,00; 11-50: 100,00; oltre 50: 100,00 + 1,50/cespite.",
      tariffSource: "LIBERO",
      amount: 50,
      periodicity: "ANNUALE",
    },
    {
      description: "Liquidazioni IVA periodiche",
      detail: null,
      tariffSource: "LIBERO",
      amount: 50,
      periodicity: "TRIMESTRALE",
    },
    {
      description: "Dichiarazione IVA annuale",
      detail: "In base al volume d'affari, si rimanda al tariffario generale.",
      tariffSource: "LIBERO",
      amount: 200,
      periodicity: "ANNUALE",
    },
    {
      description: "Dichiarazione dei redditi",
      detail: "In base ai quadri compilati: da stimare caso per caso.",
      tariffSource: "LIBERO",
      amount: null,
      periodicity: "ANNUALE",
    },
    {
      description: "Consulenze e studio casistiche (tariffa oraria)",
      detail: "80,00 €/ora professionista senior (>5 anni iscrizione albo); 60,00 €/ora junior.",
      tariffSource: "LIBERO",
      amount: null,
      periodicity: "UNA_TANTUM",
    },
  ],

  ETS_ASD: [
    {
      description: "Redazione bilancio, verbale d'assemblea e deposito presso il RUNTS",
      detail: null,
      tariffSource: "LIBERO",
      amount: null,
      periodicity: "ANNUALE",
    },
    {
      description: "Predisposizione Stato Patrimoniale, Rendiconto Gestionale e Relazione di missione",
      detail: null,
      tariffSource: "LIBERO",
      amount: null,
      periodicity: "ANNUALE",
    },
    {
      description: "Liquidazioni IVA periodiche",
      detail: null,
      tariffSource: "LIBERO",
      amount: null,
      periodicity: "ANNUALE",
    },
    { description: "Dichiarazione IVA", detail: null, tariffSource: "LIBERO", amount: null, periodicity: "ANNUALE" },
    {
      description: "Dichiarazione dei redditi enti non commerciali",
      detail: "In base ai quadri compilati.",
      tariffSource: "LIBERO",
      amount: null,
      periodicity: "ANNUALE",
    },
    { description: "Modello 770", detail: null, tariffSource: "LIBERO", amount: null, periodicity: "ANNUALE" },
    {
      description: "Certificazioni Uniche per professionisti",
      detail: null,
      tariffSource: "LIBERO",
      amount: null,
      periodicity: "ANNUALE",
    },
    {
      description: "Assistenza e consulenza continuativa in materia fiscale, contabile e di compliance",
      detail: null,
      tariffSource: "LIBERO",
      amount: null,
      periodicity: "ANNUALE",
    },
    {
      description: "Aggiornamento periodico su novità fiscali e legislative",
      detail: null,
      tariffSource: "LIBERO",
      amount: null,
      periodicity: "ANNUALE",
    },
  ],

  FORFETTARIO: [
    {
      description: "Start up: assistenza per inizio attività e apertura Partita IVA (o controllo pregresso)",
      detail: null,
      tariffSource: "LIBERO",
      amount: null,
      periodicity: "ANNUALE",
    },
    {
      description: "Gestione contabile fiscale: impostazione documenti e adempimenti iniziali",
      detail: null,
      tariffSource: "LIBERO",
      amount: null,
      periodicity: "ANNUALE",
    },
    {
      description: "Controllo formale documentazione e conteggi per la dichiarazione dei redditi PF",
      detail: null,
      tariffSource: "LIBERO",
      amount: null,
      periodicity: "ANNUALE",
    },
    {
      description:
        "Elaborazione deleghe di pagamento e redazione dichiarazione redditi (compresi 2 fabbricati e oneri deducibili/detraibili fino a 20 documenti)",
      detail: null,
      tariffSource: "LIBERO",
      amount: null,
      periodicity: "ANNUALE",
    },
  ],
};
