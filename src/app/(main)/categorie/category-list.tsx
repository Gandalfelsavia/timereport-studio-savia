"use client";

import { useState } from "react";
import type { ActivityCategory } from "@/db/schema";
import { toggleCategoryActive } from "@/app/actions/category-actions";
import { RenameCategoryForm } from "./category-form";

export default function CategoryList({ categories }: { categories: ActivityCategory[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);

  if (categories.length === 0) {
    return <p className="text-sm text-slate-500">Nessuna macrocategoria configurata.</p>;
  }

  return (
    <div className="space-y-2">
      {categories.map((cat) => (
        <div
          key={cat.id}
          className={`flex flex-wrap items-center gap-3 rounded-md border px-3 py-2 text-sm ${
            cat.active ? "border-slate-200 bg-white" : "border-slate-100 bg-slate-50 opacity-60"
          }`}
        >
          {editingId === cat.id ? (
            <RenameCategoryForm
              categoryId={cat.id}
              currentName={cat.name}
              onDone={() => setEditingId(null)}
            />
          ) : (
            <>
              <span className="font-medium text-slate-800">{cat.name}</span>
              <div className="ml-auto flex shrink-0 gap-2">
                <button
                  onClick={() => setEditingId(cat.id)}
                  className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                >
                  Rinomina
                </button>
                <button
                  onClick={() => toggleCategoryActive(cat.id, !cat.active)}
                  className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                >
                  {cat.active ? "Disattiva" : "Riattiva"}
                </button>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
