"use client";

import { useState } from "react";
import { deleteQuote } from "@/app/actions/quote-actions";

export function DeleteQuoteButton({ quoteId }: { quoteId: string }) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <span className="text-slate-600">Eliminare definitivamente questo preventivo?</span>
        <button
          onClick={() => deleteQuote(quoteId)}
          className="rounded-md bg-red-600 px-2 py-1 text-white hover:bg-red-700"
        >
          Sì, elimina
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="rounded-md border border-slate-300 px-2 py-1 text-slate-600 hover:bg-slate-50"
        >
          Annulla
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
    >
      Elimina
    </button>
  );
}
