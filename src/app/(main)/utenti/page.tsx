import { getAllUsers } from "@/lib/queries";
import { NewUserForm, UserList } from "./user-form";

export default async function UtentiPage() {
  const users = await getAllUsers();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Utenti</h1>
          <p className="text-sm text-slate-500">Gestisci gli accessi dei collaboratori dello studio.</p>
        </div>
        <NewUserForm />
      </div>
      <UserList users={users} />
    </div>
  );
}
