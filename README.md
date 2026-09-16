# Timereport — Studio Savia

Applicazione web per la rendicontazione delle attività quotidiane dei collaboratori sui clienti, con distinzione tra ore da fatturare extra e attività incluse nel forfait, report per cliente (per l'amministrazione) e report per collaboratore / panoramica generale (per il supervisore).

## Ruoli

- **Collaboratore**: registra le proprie attività giornaliere (cliente, macrocategoria, note, ore, se fatturabile o inclusa nel forfait) e vede il proprio storico.
- **Amministrazione**: gestisce l'anagrafica clienti (tariffa oraria / forfait) e le macrocategorie di attività, e consulta il report per cliente con le attività da addebitare (esportabile in CSV).
- **Supervisore** (tu): vede tutto quanto sopra, più il report per collaboratore (ore e fatturato prodotto), la panoramica generale con grafici, e gestisce gli utenti (creazione accessi, reset password).

Nella scheda di registrazione attività, il collaboratore sceglie prima una **macrocategoria** predefinita (es. Prima nota, Bilancio, Pratiche, Dichiarazioni fiscali, Consulenza — modificabili dalla sezione "Categorie attività") e poi aggiunge una breve descrizione libera per il dettaglio.

## Avvio in locale

Requisiti: Node.js 20+.

```bash
npm install
npm run db:migrate   # crea le tabelle nel database locale (file .pglite-data)
npm run db:seed      # crea utenti e dati di esempio
npm run dev
```

Apri http://localhost:3000. Utenti di prova creati dal seed (password per tutti: `cambiami123`):

| Ruolo | Email |
|---|---|
| Supervisore | fabio@studiosavia.com |
| Amministrazione | admin@studiosavia.com |
| Collaboratore | giulia@studiosavia.com |
| Collaboratore | marco@studiosavia.com |

**Importante**: cambia queste password (o crea nuovi utenti ed elimina/disattiva quelli demo) prima di usare l'app con dati reali.

In locale il database è **PGlite** (un Postgres "embedded" salvato nella cartella `.pglite-data`): non serve installare nulla, ma i dati vivono solo su questo computer/ambiente. Per l'uso reale con il team serve un database Postgres vero e proprio (vedi sotto).

## Mettere l'app online (produzione)

L'app è pensata per essere pubblicata su **Vercel**, con lo stesso schema già usato per flowts.

### 1. Crea un database Postgres

Puoi usare uno di questi servizi (hanno tutti un piano gratuito adatto a partire):

- [Supabase](https://supabase.com)
- [Neon](https://neon.tech)
- Postgres di Vercel (Storage → Postgres, dalla dashboard del progetto)

Recupera la **connection string** (es. `postgres://utente:password@host:5432/nomedb`).

### 2. Configura le variabili d'ambiente su Vercel

Nel progetto Vercel, sezione *Environment Variables*, aggiungi:

- `DATABASE_URL` → la connection string del punto 1
- `AUTH_SECRET` → una stringa casuale robusta (puoi generarla con `openssl rand -base64 32`)

Su Vercel **non serve** `AUTH_TRUST_HOST` (serve solo per test in locale dietro proxy).

### 3. Collega il repository a Vercel

Carica il progetto su GitHub (o GitLab/Bitbucket) e importalo su Vercel come faresti per un normale progetto Next.js.

Non serve eseguire nulla dal tuo computer: il progetto include uno script `vercel-build` che Vercel esegue automaticamente al posto del normale `next build`, e che prima di costruire l'app:

1. crea le tabelle nel database (`db:migrate`),
2. crea il tuo utente supervisore (`db:create-supervisor`) — `fabio@studiosavia.com` con password `cambiami123` (da cambiare al primo accesso, dalla sezione "Utenti"; per personalizzare nome/email/password in anticipo puoi impostare le variabili d'ambiente `SUPERVISOR_NAME`, `SUPERVISOR_EMAIL`, `SUPERVISOR_PASSWORD` su Vercel prima del primo deploy),
3. carica l'elenco clienti e le macrocategorie reali (`db:import-real-data`) — 196 clienti, 22 macrocategorie. È sicuro anche sui deploy successivi: salta automaticamente ciò che è già presente invece di duplicarlo.

(**Non** viene mai eseguito `db:seed` in produzione: quello resta solo per provare l'app in locale con dati fittizi.)

I clienti vengono creati **senza tariffa oraria impostata** (li ho importati solo con il nome): vai nella sezione "Clienti" per impostare tariffa oraria o forfait per ciascuno — finché non lo fai, i loro report mostreranno "—" al posto dell'importo da fatturare.

Dopo il primo deploy, accedi con l'utente supervisore creato automaticamente e crea gli account per i collaboratori dalla sezione "Utenti".

## Struttura del progetto

```
src/
  app/
    login/                    pagina di accesso
    (main)/                   pagine autenticate (con menu di navigazione)
      page.tsx                 home / riepilogo personale
      timesheet/                registrazione attività (tutti i ruoli)
      clienti/                  anagrafica clienti (admin + supervisore)
      categorie/                macrocategorie di attività (admin + supervisore)
      reports/clients/          report da fatturare per cliente (admin + supervisore)
      reports/collaboratori/    report ore/fatturato per collaboratore (supervisore)
      reports/overview/         panoramica con grafici (supervisore)
      utenti/                   gestione utenti (supervisore)
    api/                       route API (autenticazione, export CSV)
    actions/                   server actions (scritture sul database)
  auth.ts / auth.config.ts     configurazione autenticazione (NextAuth)
  proxy.ts                     protezione delle rotte in base al ruolo
  db/                          schema del database, migrazioni, seed (Drizzle ORM)
    data/                       elenco clienti e macrocategorie reali forniti dallo studio
    seed.ts                     dati fittizi per provare l'app in locale (NON per produzione)
    create-supervisor.ts        crea il primo utente supervisore in produzione
    import-real-data.ts         carica l'elenco clienti/macrocategorie reali in produzione
  lib/                         funzioni di query e formattazione condivise
```

## Limiti attuali / possibili sviluppi futuri

Questa è una prima versione funzionante pensata per iniziare a usarla e affinarla con l'uso reale. Alcune cose lasciate volutamente semplici, da valutare in un secondo momento:

- Le attività possono essere modificate/eliminate senza limiti di tempo (si potrebbe bloccare la modifica di attività già fatturate).
- Non c'è ancora un flusso di "chiusura mese" che segni le attività come già fatturate.
- Il report clienti si esporta in CSV; se serve un PDF pronto per l'invio ai clienti si può aggiungere.
- Non ci sono notifiche/promemoria per chi dimentica di compilare il timesheet.
- Le tariffe sono per cliente; se in futuro servissero tariffe diverse per collaboratore (es. per seniority) lo schema andrà esteso.

Fammi sapere quali di questi punti vuoi affrontare per primi.
