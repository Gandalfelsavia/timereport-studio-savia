// Festività nazionali italiane e calcolo del primo giorno lavorativo
// successivo, usato per calcolare le scadenze fiscali: per legge, quando una
// scadenza cade di sabato, domenica o giorno festivo, si sposta al primo
// giorno non festivo successivo.
//
// Nota: le fonti feriali qui considerate sono quelle NAZIONALI. Le festività
// patronali locali (es. San Giovanni a Torino) non spostano le scadenze
// fiscali, quindi non sono incluse.

// Calcola la data di Pasqua (calendario gregoriano) con l'algoritmo di Meeus.
function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 = marzo, 4 = aprile
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date.getTime());
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// Festività nazionali fisse + Pasquetta (variabile), per l'anno indicato.
export function italianHolidays(year: number): Set<string> {
  const easterMonday = addDays(easterSunday(year), 1);
  const fixed = [
    `${year}-01-01`, // Capodanno
    `${year}-01-06`, // Epifania
    `${year}-04-25`, // Liberazione
    `${year}-05-01`, // Festa dei lavoratori
    `${year}-06-02`, // Festa della Repubblica
    `${year}-08-15`, // Ferragosto
    `${year}-11-01`, // Tutti i Santi
    `${year}-12-08`, // Immacolata
    `${year}-12-25`, // Natale
    `${year}-12-26`, // Santo Stefano
  ];
  return new Set([...fixed, toIsoDate(easterMonday)]);
}

export function isWeekend(date: Date): boolean {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

// Data di una scadenza (year-month-day, UTC) → stringa ISO della scadenza
// effettiva, spostata al primo giorno lavorativo successivo se cade di
// sabato, domenica o festivo nazionale.
export function nextBusinessDayIso(isoDate: string): string {
  let date = new Date(`${isoDate}T00:00:00Z`);
  const holidaysByYear = new Map<number, Set<string>>();
  const getHolidays = (y: number) => {
    let h = holidaysByYear.get(y);
    if (!h) {
      h = italianHolidays(y);
      holidaysByYear.set(y, h);
    }
    return h;
  };
  // Al massimo serve scorrere pochi giorni: un ciclo di sicurezza evita loop
  // infiniti in caso di bug nei dati delle festività.
  for (let i = 0; i < 14; i++) {
    const iso = toIsoDate(date);
    const holidays = getHolidays(date.getUTCFullYear());
    if (!isWeekend(date) && !holidays.has(iso)) {
      return iso;
    }
    date = addDays(date, 1);
  }
  return toIsoDate(date);
}

export function makeIsoDate(year: number, month: number, day: number): string {
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

export { addDays, toIsoDate };
