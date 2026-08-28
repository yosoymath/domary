import type { OrderStatus, PaymentStatus } from "@prisma/client";

export const orderStatusLabel: Record<OrderStatus, string> = {
  PENDING: "Pedido recebido",
  CONFIRMED: "Confirmado",
  PROCESSING: "Em preparação",
  SHIPPED: "Pronto para retirada",
  DELIVERED: "Retirado",
  CANCELED: "Cancelado",
};

export const paymentStatusLabel: Record<PaymentStatus, string> = {
  PENDING: "Pagamento pendente",
  PAID: "Pago",
  FAILED: "Pagamento não concluído",
  REFUNDED: "Reembolsado",
};

export function formatCurrency(value: number | string | { toString(): string }) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value));
}

export function formatDate(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}

export function orderNumber(number: number) {
  return `#${number.toString().padStart(6, "0")}`;
}
