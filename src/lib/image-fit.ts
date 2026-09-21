// Calcola le dimensioni di un'immagine "contenuta" in un riquadro massimo
// mantenendo le proporzioni originali (equivalente all'opzione "fit" di
// pdfkit, ma serve esplicitamente anche per il generatore Word, che altrimenti
// deformerebbe i loghi con proporzioni diverse da quelle del riquadro).
export function fitDimensions(
  naturalWidth: number,
  naturalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  if (naturalWidth <= 0 || naturalHeight <= 0) return { width: maxWidth, height: maxHeight };
  const scale = Math.min(maxWidth / naturalWidth, maxHeight / naturalHeight);
  return { width: Math.round(naturalWidth * scale), height: Math.round(naturalHeight * scale) };
}
