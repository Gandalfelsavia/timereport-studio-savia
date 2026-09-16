import { getAllClients } from "@/lib/queries";
import { NewClientForm } from "./client-form";
import ClientList from "./client-list";

export default async function ClientiPage() {
  const clients = await getAllClients();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Clienti</h1>
          <p className="text-sm text-slate-500">
            Gestisci l&apos;anagrafica clienti e le condizioni di fatturazione.
          </p>
        </div>
        <NewClientForm />
      </div>

      <ClientList clients={clients} />
    </div>
  );
}
