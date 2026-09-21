import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @electric-sql/pglite carica file wasm/dati tramite import.meta.url: va lasciato
  // fuori dal bundle del server e caricato direttamente da Node (require nativo),
  // altrimenti Turbopack/webpack rompe la risoluzione dei percorsi in produzione.
  serverExternalPackages: ["@electric-sql/pglite", "postgres", "pdfkit"],
  // pdfkit legge a runtime i file .afm con le metriche dei font standard
  // (node_modules/pdfkit/js/data/*.afm). Il "file tracing" di Vercel, che
  // decide quali file includere nella funzione serverless di ogni route, non
  // li individua automaticamente: senza questa inclusione esplicita la
  // generazione PDF fallisce in produzione (funziona invece in locale, dove
  // tutto il filesystem è disponibile) con un errore di file non trovato.
  outputFileTracingIncludes: {
    "/api/**/*": ["./node_modules/pdfkit/js/data/**/*"],
  },
  // L'eslint flat-config del progetto non è compatibile al 100% con questa versione
  // di eslint-config-next; il controllo di qualità del codice si fa comunque con
  // `npm run lint` in locale, ma non deve poter bloccare la build di produzione.
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
