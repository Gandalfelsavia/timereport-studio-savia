import { getAllCategories } from "@/lib/queries";
import { NewCategoryForm } from "./category-form";
import CategoryList from "./category-list";

export default async function CategoriePage() {
  const categories = await getAllCategories();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Categorie attività</h1>
        <p className="text-sm text-slate-500">
          Le macrocategorie che i collaboratori possono scegliere rapidamente quando registrano
          un&apos;attività (es. Prima nota, Bilancio, Pratiche…). La descrizione libera resta a
          disposizione per il dettaglio.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <NewCategoryForm />
      </div>

      <CategoryList categories={categories} />
    </div>
  );
}
