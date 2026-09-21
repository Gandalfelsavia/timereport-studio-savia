export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

export function formatHours(value: number): string {
  return new Intl.NumberFormat("it-IT", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value) + " h";
}

export function formatPercent(value: number): string {
  return (
    new Intl.NumberFormat("it-IT", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    }).format(value) + "%"
  );
}

export function formatDate(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

export const roleLabels: Record<string, string> = {
  EMPLOYEE: "Collaboratore",
  ADMIN: "Amministrazione",
  SUPERVISOR: "Supervisore",
};

export const billingTypeLabels: Record<string, string> = {
  HOURLY: "A tariffa oraria",
  FORFAIT: "Forfait",
  MIXED: "Misto (forfait + extra a ore)",
};
