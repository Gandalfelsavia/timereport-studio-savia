import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { getQuoteWithLines } from "@/lib/queries";
import { generateQuotePdf } from "@/lib/quote-pdf";

export async function GET(req: NextRequest, ctx: RouteContext<"/api/preventivi/[quoteId]/pdf">) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPERVISOR")) {
    return new Response("Non autorizzato", { status: 403 });
  }

  const { quoteId } = await ctx.params;
  const data = await getQuoteWithLines(quoteId);
  if (!data || !data.entity) return new Response("Preventivo non trovato", { status: 404 });

  const pdfBuffer = await generateQuotePdf(data);
  const filename = `preventivo_${data.quote.recipientName.replace(/[^a-z0-9]+/gi, "_")}.pdf`;

  return new Response(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
    },
  });
}
