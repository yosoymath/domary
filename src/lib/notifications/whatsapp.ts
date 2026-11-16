import "server-only";

import { prisma } from "@/lib/prisma";
import { buildPaidOrderMessage } from "@/lib/notifications/order-message";

const ZAPI_BASE_URL = "https://api.z-api.io";
const CALLMEBOT_URL = "https://api.callmebot.com/whatsapp.php";
const GREENAPI_DEFAULT_URL = "https://api.green-api.com";
const REQUEST_TIMEOUT_MS = 10000;

type WhatsAppConfig =
  | { provider: "callmebot"; apiKey: string; phone: string }
  | { provider: "greenapi"; apiUrl: string; idInstance: string; apiToken: string; phone: string }
  | { provider: "zapi"; instanceId: string; instanceToken: string; clientToken?: string; phone: string };

function whatsAppConfig(): WhatsAppConfig | null {
  const phone = process.env.WHATSAPP_NOTIFY_PHONE?.replace(/\D/g, "");
  if (!phone) return null;

  // CallMeBot (gratuito, só envia para o próprio número que ativou a chave) tem prioridade.
  const callMeBotKey = process.env.CALLMEBOT_API_KEY?.trim();
  if (callMeBotKey) return { provider: "callmebot", apiKey: callMeBotKey, phone };

  // Green-API: plano Developer gratuito (até 3 conversas), conectado por QR Code.
  const greenIdInstance = process.env.GREENAPI_ID_INSTANCE?.trim();
  const greenApiToken = process.env.GREENAPI_API_TOKEN?.trim();
  if (greenIdInstance && greenApiToken) {
    const apiUrl = (process.env.GREENAPI_API_URL?.trim() || GREENAPI_DEFAULT_URL).replace(/\/+$/, "");
    return { provider: "greenapi", apiUrl, idInstance: greenIdInstance, apiToken: greenApiToken, phone };
  }

  const instanceId = process.env.ZAPI_INSTANCE_ID?.trim();
  const instanceToken = process.env.ZAPI_INSTANCE_TOKEN?.trim();
  const clientToken = process.env.ZAPI_CLIENT_TOKEN?.trim() || undefined;
  if (instanceId && instanceToken) return { provider: "zapi", instanceId, instanceToken, clientToken, phone };

  return null;
}

async function sendWithCallMeBot(config: Extract<WhatsAppConfig, { provider: "callmebot" }>, text: string) {
  const url = new URL(CALLMEBOT_URL);
  url.searchParams.set("phone", `+${config.phone}`);
  url.searchParams.set("text", text);
  url.searchParams.set("apikey", config.apiKey);

  const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  const body = await response.text().catch(() => "");
  // O CallMeBot responde em HTML e nem sempre usa status de erro: confere também o texto.
  if (!response.ok || /invalid|error|not (?:valid|allowed|activated)|paused|blocked/i.test(body)) {
    const reason = body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 200) || "resposta vazia";
    throw new Error(`CallMeBot recusou a mensagem (HTTP ${response.status}): ${reason}`);
  }
}

async function sendWithGreenApi(config: Extract<WhatsAppConfig, { provider: "greenapi" }>, text: string) {
  const url = `${config.apiUrl}/waInstance${encodeURIComponent(config.idInstance)}/sendMessage/${encodeURIComponent(config.apiToken)}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chatId: `${config.phone}@c.us`, message: text, linkPreview: false }),
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const data = (await response.json().catch(() => null)) as { idMessage?: string; message?: string } | null;

  if (!response.ok || !data?.idMessage) {
    throw new Error(`Green-API recusou a mensagem (HTTP ${response.status}): ${String(data?.message ?? "resposta inesperada").slice(0, 200)}`);
  }
}

async function sendWithZApi(config: Extract<WhatsAppConfig, { provider: "zapi" }>, text: string) {
  const url = `${ZAPI_BASE_URL}/instances/${encodeURIComponent(config.instanceId)}/token/${encodeURIComponent(config.instanceToken)}/send-text`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (config.clientToken) headers["Client-Token"] = config.clientToken;

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ phone: config.phone, message: text }),
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const data = (await response.json().catch(() => null)) as { zaapId?: string; messageId?: string; error?: string; message?: string } | null;

  if (!response.ok || !(data?.zaapId || data?.messageId)) {
    const reason = data?.error ?? data?.message ?? "resposta inesperada";
    throw new Error(`Z-API recusou a mensagem (HTTP ${response.status}): ${String(reason).slice(0, 200)}`);
  }
}

/**
 * Envia uma mensagem de texto para o número configurado em WHATSAPP_NOTIFY_PHONE
 * (DDI + DDD + número, só dígitos), pelo CallMeBot, Green-API ou Z-API.
 */
export async function sendWhatsAppMessage(text: string) {
  const config = whatsAppConfig();
  if (!config) return { sent: false as const, reason: "not_configured" as const };

  if (config.provider === "callmebot") await sendWithCallMeBot(config, text);
  else if (config.provider === "greenapi") await sendWithGreenApi(config, text);
  else await sendWithZApi(config, text);

  return { sent: true as const, provider: config.provider };
}

/**
 * Avisa o responsável da loja sobre um pedido recém-pago.
 * Nunca lança erro: uma falha no WhatsApp não pode desfazer a confirmação do pagamento.
 */
export async function notifyOrderPaid(orderId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        number: true,
        paidAt: true,
        createdAt: true,
        paymentMethod: true,
        subtotal: true,
        discountAmount: true,
        total: true,
        customerNote: true,
        user: { select: { name: true, email: true, phone: true } },
        items: {
          orderBy: { createdAt: "asc" },
          select: { productName: true, sku: true, attributes: true, quantity: true, unitPrice: true, total: true },
        },
      },
    });
    if (!order) return;

    const result = await sendWhatsAppMessage(buildPaidOrderMessage({ ...order, customer: order.user }));
    if (!result.sent) console.warn("Aviso de WhatsApp não enviado: configure WHATSAPP_NOTIFY_PHONE e as variáveis de um provedor (CallMeBot, Green-API ou Z-API).");
  } catch (error) {
    console.error("Falha ao enviar aviso de pedido pago por WhatsApp", {
      orderId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
