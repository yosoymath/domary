export type PagBankCharge = {
  id?: string;
  status?: string;
  paid_at?: string;
  amount?: { value?: number };
  payment_method?: { type?: string };
};

export type PagBankWebhookPayload = {
  id?: string;
  reference_id?: string;
  status?: string;
  charges?: PagBankCharge[];
};

export type PagBankPaymentUpdate = {
  kind: "paid" | "pending" | "failed";
  detail: string;
  chargeId?: string;
  paymentMethod?: string;
  amountCents?: number;
  paidAt?: Date;
};

// Uma cobrança recusada/cancelada não encerra necessariamente a página de
// Checkout: o comprador ainda pode escolher outro meio de pagamento. A reserva
// só é liberada quando o próprio checkout expira.
const pendingStatuses = new Set(["AUTHORIZED", "IN_ANALYSIS", "WAITING", "CANCELED", "DECLINED"]);
const failedStatuses = new Set(["EXPIRED"]);

export function parsePagBankPaymentUpdate(payload: PagBankWebhookPayload): PagBankPaymentUpdate | null {
  const charge = payload.charges?.find((item) => item.status === "PAID") ?? payload.charges?.[0];
  const detail = String(charge?.status ?? payload.status ?? "").toUpperCase();

  if (!detail) return null;

  const common = {
    detail,
    chargeId: charge?.id,
    paymentMethod: charge?.payment_method?.type,
    amountCents: charge?.amount?.value,
  };

  if (detail === "PAID") {
    const paidAt = charge?.paid_at ? new Date(charge.paid_at) : new Date();
    return { ...common, kind: "paid", paidAt: Number.isNaN(paidAt.getTime()) ? new Date() : paidAt };
  }

  if (pendingStatuses.has(detail)) return { ...common, kind: "pending" };
  if (failedStatuses.has(detail)) return { ...common, kind: "failed" };
  return null;
}
