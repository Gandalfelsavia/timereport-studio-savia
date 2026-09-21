import Link from "next/link";
import { auth, signOut } from "@/auth";
import { roleLabels } from "@/lib/format";

const links = [
  { href: "/", label: "Home", roles: ["EMPLOYEE", "ADMIN", "SUPERVISOR"] },
  { href: "/timesheet", label: "Timesheet", roles: ["EMPLOYEE", "ADMIN", "SUPERVISOR"] },
  { href: "/clienti", label: "Clienti", roles: ["ADMIN", "SUPERVISOR"] },
  { href: "/preventivi", label: "Preventivi", roles: ["ADMIN", "SUPERVISOR"] },
  { href: "/categorie", label: "Categorie attività", roles: ["ADMIN", "SUPERVISOR"] },
  { href: "/reports/clients", label: "Report clienti", roles: ["ADMIN", "SUPERVISOR"] },
  { href: "/reports/collaboratori", label: "Report collaboratori", roles: ["SUPERVISOR"] },
  { href: "/reports/overview", label: "Panoramica", roles: ["SUPERVISOR"] },
  { href: "/utenti", label: "Utenti", roles: ["SUPERVISOR"] },
];

export default async function Nav() {
  const session = await auth();
  const role = session?.user?.role;
  if (!role) return null;

  const visibleLinks = links.filter((l) => l.roles.includes(role));

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex flex-wrap items-center gap-1">
          <span className="mr-3 font-semibold text-slate-900">Timereport</span>
          {visibleLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-md px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              {l.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <span>
            {session.user.name}{" "}
            <span className="text-xs text-slate-400">({roleLabels[role]})</span>
          </span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button className="rounded-md border border-slate-300 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100">
              Esci
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
