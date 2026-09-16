import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @electric-sql/pglite carica file wasm/dati tramite import.meta.url: va lasciato
  // fuori dal bundle del server e caricato direttamente da Node (require nativo),
  // altrimenti Turbopack/webpack rompe la risoluzione dei percorsi in produzione.
  serverExternalPackages: ["@electric-sql/pglite", "postgres"],
};

export default nextConfig;
