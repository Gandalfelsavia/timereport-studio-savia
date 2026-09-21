import { z } from "zod";

// Zod per una checkbox HTML: quando la casella non è selezionata, il browser
// NON invia affatto il campo nel FormData (a differenza di un input testuale
// vuoto). Con `z.coerce.boolean()` questo causa un errore di validazione
// ("expected nonoptional, received undefined") perché Zod verifica la
// presenza della chiave prima di applicare la coercizione. z.preprocess()
// intercetta invece anche il valore assente e lo tratta correttamente come
// "non selezionato" (false).
export const checkboxBoolean = () =>
  z.preprocess((value) => value === "on" || value === "true" || value === true, z.boolean());
