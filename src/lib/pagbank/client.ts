import "server-only";

type CheckoutItem = {
  referenceId: string;
  name: string;
  quantity: number;
  unitAmount: number;
};

export type CreatePagBankCheckoutInput = {
  orderId: string;
  items: CheckoutItem[];
};

type PagBankLink = {
  rel?: string;
  href?: string;
  method?: string;
};

type PagBankCheckoutResponse = {
  id?: string;
  links?: PagBankLink[];
};

export class PagBankApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly retryable = true,
  ) {
    super(message);
    this.name = "PagBankApiError";
  }
}

function integerEnv(name: string, defaultValue: number, minimum: number, maximum: number) {
  const rawValue = process.env[name];
  const value = rawValue === undefined || rawValue === "" ? defaultValue : Number(rawValue);

  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${name} deve ser um número inteiro entre ${minimum} e ${maximum}.`);
  }

  return value;
}

export function getPagBankSettings() {
  const environment = process.env.PAGBANK_ENV === "production" ? "production" : "sandbox";
  const token = process.env.PAGBANK_TOKEN?.trim();
  const appUrlValue = process.env.APP_URL?.trim();

  if (!token) throw new Error("PAGBANK_TOKEN não foi configurado.");
  if (!appUrlValue) throw new Error("APP_URL não foi configurada.");

  const appUrl = new URL(appUrlValue);
  if (environment === "production" && appUrl.protocol !== "https:") {
    throw new Error("APP_URL deve usar HTTPS no ambiente de produção.");
  }

  const installmentsLimit = integerEnv("PAGBANK_INSTALLMENTS_LIMIT", 3, 1, 12);
  const interestFreeInstallments = integerEnv("PAGBANK_INTEREST_FREE_INSTALLMENTS", 0, 0, installmentsLimit);

  return {
    environment,
    token,
    appUrl: appUrl.origin,
    apiUrl: environment === "production" ? "https://api.pagseguro.com" : "https://sandbox.api.pagseguro.com",
    installmentsLimit,
    interestFreeInstallments,
  } as const;
}

export function buildPagBankCheckoutPayload(
  input: CreatePagBankCheckoutInput,
  settings: Pick<ReturnType<typeof getPagBankSettings>, "appUrl" | "installmentsLimit" | "interestFreeInstallments">,
) {
  const webhookUrl = `${settings.appUrl}/api/webhooks/pagbank`;
  const returnUrl = `${settings.appUrl}/checkout/retorno?order=${encodeURIComponent(input.orderId)}`;
  const configOptions = [
    { option: "INSTALLMENTS_LIMIT", value: String(settings.installmentsLimit) },
  ];

  if (settings.interestFreeInstallments > 0) {
    configOptions.push({ option: "INTEREST_FREE_INSTALLMENTS", value: String(settings.interestFreeInstallments) });
  }

  return {
    reference_id: input.orderId,
    items: input.items.map((item) => ({
      reference_id: item.referenceId,
      name: item.name.slice(0, 100),
      quantity: item.quantity,
      unit_amount: item.unitAmount,
    })),
    payment_methods: [
      { type: "CREDIT_CARD" },
      { type: "PIX" },
      { type: "BOLETO" },
    ],
    payment_methods_configs: [{ type: "CREDIT_CARD", config_options: configOptions }],
    soft_descriptor: "DOMARY",
    redirect_url: returnUrl,
    redirect_waiting_time: 5,
    return_url: returnUrl,
    notification_urls: [webhookUrl],
    payment_notification_urls: [webhookUrl],
  };
}

export async function createPagBankCheckout(input: CreatePagBankCheckoutInput) {
  const settings = getPagBankSettings();
  let response: Response;

  try {
    response = await fetch(`${settings.apiUrl}/checkouts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${settings.token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildPagBankCheckoutPayload(input, settings)),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    throw new PagBankApiError(error instanceof Error ? error.message : "Falha de comunicação com o PagBank.");
  }

  const rawResponse = await response.text();
  let data: PagBankCheckoutResponse & { error_messages?: Array<{ description?: string }> } = {};

  try {
    data = rawResponse ? JSON.parse(rawResponse) : {};
  } catch {
    // A mensagem pública abaixo evita expor uma resposta inesperada do provedor.
  }

  if (!response.ok) {
    const description = data.error_messages?.map((item) => item.description).filter(Boolean).join(" ");
    throw new PagBankApiError(
      description || `O PagBank recusou a criação do checkout (${response.status}).`,
      response.status,
      response.status >= 500 || response.status === 429,
    );
  }

  const payUrl = data.links?.find((link) => link.rel === "PAY" && link.method === "GET")?.href;
  if (!data.id || !payUrl) {
    throw new PagBankApiError("O PagBank não devolveu o link de pagamento esperado.");
  }

  return { checkoutId: data.id, payUrl };
}
