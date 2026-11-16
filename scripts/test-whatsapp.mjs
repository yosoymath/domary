// Envia uma mensagem de teste pelo WhatsApp usando as variáveis do .env.
// Ordem: CallMeBot (CALLMEBOT_API_KEY), Green-API (GREENAPI_ID_INSTANCE), Z-API.
// Uso: npm run whatsapp:test
const phone = process.env.WHATSAPP_NOTIFY_PHONE?.replace(/\D/g, "");
const callMeBotKey = process.env.CALLMEBOT_API_KEY?.trim();
const greenIdInstance = process.env.GREENAPI_ID_INSTANCE?.trim();
const greenApiToken = process.env.GREENAPI_API_TOKEN?.trim();
const greenApiUrl = (process.env.GREENAPI_API_URL?.trim() || "https://api.green-api.com").replace(/\/+$/, "");
const instanceId = process.env.ZAPI_INSTANCE_ID?.trim();
const instanceToken = process.env.ZAPI_INSTANCE_TOKEN?.trim();
const clientToken = process.env.ZAPI_CLIENT_TOKEN?.trim();
const message = "✅ *Teste Domary*\nOs avisos de pedidos pagos chegarão neste WhatsApp.";
const maskedPhone = phone ? `${phone.slice(0, 4)}…${phone.slice(-2)}` : "";

if (!phone || (!callMeBotKey && !(greenIdInstance && greenApiToken) && !(instanceId && instanceToken))) {
  console.error("Defina WHATSAPP_NOTIFY_PHONE e as variáveis de um provedor (CallMeBot, Green-API ou Z-API) no .env antes de testar.");
  process.exit(1);
}

if (callMeBotKey) {
  const url = new URL("https://api.callmebot.com/whatsapp.php");
  url.searchParams.set("phone", `+${phone}`);
  url.searchParams.set("text", message);
  url.searchParams.set("apikey", callMeBotKey);

  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
  const body = (await response.text()).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  console.log(`CallMeBot respondeu HTTP ${response.status}: ${body.slice(0, 300)}`);
  if (!response.ok || /invalid|error|not (?:valid|allowed|activated)|paused|blocked/i.test(body)) {
    console.error("Falha. Confira se a chave foi ativada para este mesmo número (WHATSAPP_NOTIFY_PHONE).");
    process.exit(1);
  }
  console.log(`Mensagem enviada para ${maskedPhone} pelo CallMeBot.`);
  process.exit(0);
}

if (greenIdInstance && greenApiToken) {
  const response = await fetch(
    `${greenApiUrl}/waInstance${encodeURIComponent(greenIdInstance)}/sendMessage/${encodeURIComponent(greenApiToken)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatId: `${phone}@c.us`, message, linkPreview: false }),
      signal: AbortSignal.timeout(15000),
    },
  );
  const text = await response.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch {}

  if (!response.ok || !data?.idMessage) {
    console.error(`Falha (HTTP ${response.status}): ${(data?.message ?? text).toString().slice(0, 300)}`);
    console.error("Confira idInstance, apiTokenInstance, o apiUrl da instância (GREENAPI_API_URL) e se o WhatsApp está conectado por QR Code no console.");
    process.exit(1);
  }
  console.log(`Mensagem enviada para ${maskedPhone} pelo Green-API (idMessage ${data.idMessage}).`);
  process.exit(0);
}

const headers = { "Content-Type": "application/json" };
if (clientToken) headers["Client-Token"] = clientToken;

const response = await fetch(
  `https://api.z-api.io/instances/${encodeURIComponent(instanceId)}/token/${encodeURIComponent(instanceToken)}/send-text`,
  {
    method: "POST",
    headers,
    body: JSON.stringify({ phone, message }),
    signal: AbortSignal.timeout(15000),
  },
);
const text = await response.text();
let data = null;
try {
  data = JSON.parse(text);
} catch {}

if (!response.ok || !(data?.zaapId || data?.messageId)) {
  console.error(`Falha (HTTP ${response.status}): ${(data?.error ?? data?.message ?? text).toString().slice(0, 300)}`);
  if (response.status === 400 || response.status === 401 || response.status === 403) {
    console.error("Confira o ID e o token da instância, o Client-Token (se a segurança estiver ativa) e se o WhatsApp está conectado por QR Code no painel.");
  }
  process.exit(1);
}

console.log(`Mensagem enviada para ${maskedPhone} pelo Z-API (messageId ${data.messageId ?? data.zaapId}).`);
