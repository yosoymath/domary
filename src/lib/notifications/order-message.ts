import { formatCurrency } from "@/lib/formatters";
import { formatPhone } from "@/lib/masks";

export type PaidOrderMessageData = {
  number: number;
  paidAt: Date | null;
  createdAt: Date;
  paymentMethod: string | null;
  subtotal: { toString(): string };
  discountAmount: { toString(): string };
  total: { toString(): string };
  customerNote: string | null;
  customer: { name: string; email: string; phone: string | null };
  items: Array<{
    productName: string;
    sku: string;
    attributes: unknown;
    quantity: number;
    unitPrice: { toString(): string };
    total: { toString(): string };
  }>;
};

const paymentMethodLabels: Record<string, string> = {
  CREDIT_CARD: "Cartão de crédito",
  DEBIT_CARD: "Cartão de débito",
  PIX: "Pix",
  BOLETO: "Boleto",
};

// O WhatsApp interpreta *, _, ~ e ` como formatação. Removê-los dos textos
// digitados por clientes evita mensagens com formatação quebrada.
function plain(value: string) {
  return value.replace(/[*_~`]/g, "").replace(/\s+/g, " ").trim();
}

function variantLabel(attributes: unknown) {
  if (!attributes || typeof attributes !== "object" || Array.isArray(attributes)) return "";
  const { size, color } = attributes as { size?: unknown; color?: unknown };
  return [size, color].filter((value): value is string => typeof value === "string" && value.trim() !== "").map(plain).join(" / ");
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(value);
}

export function buildPaidOrderMessage(order: PaidOrderMessageData) {
  const lines: string[] = [
    `🛍️ *Novo pedido pago · Domary #${order.number}*`,
    "",
    `📅 ${formatDateTime(order.paidAt ?? order.createdAt)}`,
    `💳 ${order.paymentMethod ? paymentMethodLabels[order.paymentMethod] ?? plain(order.paymentMethod) : "Pagamento confirmado"}`,
    "📦 Retirada na loja",
    "",
    "👤 *Cliente*",
    plain(order.customer.name),
  ];

  if (order.customer.phone) lines.push(`📞 ${formatPhone(order.customer.phone)}`);
  lines.push(`✉️ ${order.customer.email}`, "", "🧾 *Itens*");

  for (const item of order.items) {
    const variant = variantLabel(item.attributes);
    lines.push(
      `• ${item.quantity}x ${plain(item.productName)}${variant ? ` (${variant})` : ""}`,
      `   SKU ${plain(item.sku)} · ${formatCurrency(item.unitPrice)} cada = ${formatCurrency(item.total)}`,
    );
  }

  lines.push("", `Subtotal: ${formatCurrency(order.subtotal)}`);
  if (Number(order.discountAmount) > 0) lines.push(`Desconto: -${formatCurrency(order.discountAmount)}`);
  lines.push(`*Total: ${formatCurrency(order.total)}*`);

  if (order.customerNote?.trim()) lines.push("", `📝 Observação: ${plain(order.customerNote)}`);

  return lines.join("\n");
}
