import { revalidatePath } from "next/cache";
import { z } from "zod";
import { applyPagBankPaymentUpdate, CheckoutDomainError } from "@/lib/checkout/orders";
import { verifyPagBankSignature } from "@/lib/pagbank/signature";
import { parsePagBankPaymentUpdate, type PagBankWebhookPayload } from "@/lib/pagbank/webhook";
import { notifyOrderPaid } from "@/lib/notifications/whatsapp";

export const runtime = "nodejs";

const orderIdSchema = z.string().uuid();

export async function POST(request: Request) {
  const token = process.env.PAGBANK_TOKEN?.trim();
  if (!token) {
    console.error("Webhook PagBank recebido sem PAGBANK_TOKEN configurado.");
    return new Response(null, { status: 500 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-authenticity-token");
  if (!signature || !verifyPagBankSignature(rawBody, token, signature)) {
    return Response.json({ error: "Assinatura inválida." }, { status: 401 });
  }

  let payload: PagBankWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as PagBankWebhookPayload;
  } catch {
    return Response.json({ error: "JSON inválido." }, { status: 400 });
  }

  const orderId = orderIdSchema.safeParse(payload.reference_id);
  if (!orderId.success) return new Response(null, { status: 204 });

  const update = parsePagBankPaymentUpdate(payload);
  if (!update) return new Response(null, { status: 204 });

  try {
    const result = await applyPagBankPaymentUpdate(orderId.data, update);
    if (result === "not_found") return new Response(null, { status: 204 });

    if (result === "newly_paid") await notifyOrderPaid(orderId.data);

    revalidatePath("/account/orders");
    revalidatePath("/account/orders/[number]", "page");
    revalidatePath("/checkout/retorno");
    return new Response(null, { status: 204 });
  } catch (error) {
    if (error instanceof CheckoutDomainError) {
      console.error("Webhook PagBank rejeitado", { code: error.code, orderId: orderId.data });
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error("Falha ao processar webhook PagBank", error);
    return new Response(null, { status: 500 });
  }
}
