// Anagrafica delle realtà emittenti i preventivi. Studio Savia non è ancora
// incluso: si parte solo con ABSV Consulting e RSVV, come concordato.

export const quoteEntitiesSeed = [
  {
    key: "RSVV" as const,
    name: "Studio Associato Ramazzotto Savia Valetti Voghera",
    legalForm: "Studio Associato",
    address: "Corso Re Umberto 77, 10128 Torino (TO) – Via Pinerolo 52, 10045 Piossasco (TO)",
    taxCode: "13322090013",
    vatNumber: "13322090013",
    sdiCode: "M5UXCR1",
    pec: "amministrazione@pec.rsvv.it",
    phone: "Tel. Torino 011 505 610 / 011 503 096 – Tel. Piossasco 011 349 0809",
    signerName: "Fabio Savia",
    logoFile: "/entities/rsvv-logo.png",
    appliesRitenutaCp: true,
    showStaffRoster: true,
    tariffUrl: "https://rsvv.it/tariffario/",
    insuranceNote:
      "Lo Studio Associato Ramazzotto Savia Valetti Voghera è assicurato per la responsabilità civile contro i rischi professionali.",
  },
  {
    key: "ABSV" as const,
    name: "ABSV Consulting SRL",
    legalForm: "SRL",
    address: "Via Pinerolo 52, 10045 Piossasco (TO)",
    taxCode: "11112460016",
    vatNumber: "11112460016",
    sdiCode: null,
    pec: "amministrazione@pec.absvconsulting.it",
    phone: null,
    signerName: "Paola Del Fante",
    logoFile: "/entities/absv-logo.png",
    appliesRitenutaCp: false,
    showStaffRoster: false,
    tariffUrl: "https://absvconsulting.it/tariffario/",
    insuranceNote: "ABSV Consulting Srl ed i professionisti di riferimento sono assicurati per la responsabilità civile contro i rischi professionali.",
  },
];

// Elenco professionisti RSVV con numero ODCEC, come riportato in calce ai
// preventivi reali (es. Arka Immobiliare, Calligaris Viola).
export const rsvvStaffSeed = [
  { fullName: "Ramazzotto Roberto", title: "Commercialista", odcecNumber: "ODCEC Torino n. 745", sortOrder: 0 },
  { fullName: "Ramazzotto Alberto", title: "Commercialista", odcecNumber: "ODCEC Torino n. 4142", sortOrder: 1 },
  {
    fullName: "Savia Enrico",
    title: "Commercialista, Revisore Legale e Chartered Accountant in UAE",
    odcecNumber: "ODCEC Torino n. 916",
    sortOrder: 2,
  },
  { fullName: "Savia Fabio", title: "Commercialista", odcecNumber: "ODCEC Torino n. 4983", sortOrder: 3 },
  { fullName: "Valetti Daniela", title: "Commercialista", odcecNumber: "ODCEC Torino n. 604", sortOrder: 4 },
  { fullName: "Voghera Lidia", title: "Commercialista", odcecNumber: "ODCEC Torino n. 574", sortOrder: 5 },
];
