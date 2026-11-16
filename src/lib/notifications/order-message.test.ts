import { describe, expect, it } from "vitest";
import { buildPaidOrderMessage, type PaidOrderMessageData } from "@/lib/notifications/order-message";

function order(overrides: Partial<PaidOrderMessageData> = {}): PaidOrderMessageData {
  return {
    number: 1042,
    paidAt: new Date("2026-11-16T17:30:00.000Z"),
    createdAt: new Date("2026-11-16T17:20:00.000Z"),
    paymentMethod: "CREDIT_CARD",
    subtotal: "379.80",
    discountAmount: "0",
    total: "379.80",
    customerNote: null,
    customer: { name: "Maria Souza", email: "maria@example.com", phone: "11987654321" },
    items: [
      { productName: "Camiseta Polo Sallo", sku: "POLO-M-BEGE", attributes: { size: "M", color: "Bege" }, quantity: 2, unitPrice: "189.90", total: "379.80" },
    ],
    ...overrides,
  };
}

describe("buildPaidOrderMessage", () => {
  it("inclui número, cliente, itens, pagamento e total no horário de Brasília", () => {
    const message = buildPaidOrderMessage(order());

    expect(message).toContain("Domary #1042");
    expect(message).toContain("16/11/2026, 14:30");
    expect(message).toContain("Cartão de crédito");
    expect(message).toContain("Retirada na loja");
    expect(message).toContain("Maria Souza");
    expect(message).toContain("(11) 98765-4321");
    expect(message).toContain("2x Camiseta Polo Sallo (M / Bege)");
    expect(message).toMatch(/\*Total: R\$\s379,80\*/);
    expect(message).not.toContain("Desconto");
  });

  it("mostra desconto e observação e neutraliza a formatação digitada pelo cliente", () => {
    const message = buildPaidOrderMessage(order({ discountAmount: "20", customerNote: "Retiro *amanhã* _cedo_" }));

    expect(message).toMatch(/Desconto: -R\$\s20,00/);
    expect(message).toContain("Observação: Retiro amanhã cedo");
  });

  it("funciona sem telefone, sem variação e com método de pagamento desconhecido", () => {
    const message = buildPaidOrderMessage(order({
      paymentMethod: "WALLET",
      customer: { name: "João", email: "joao@example.com", phone: null },
      items: [{ productName: "Boné", sku: "BONE", attributes: null, quantity: 1, unitPrice: "79.90", total: "79.90" }],
    }));

    expect(message).toContain("WALLET");
    expect(message).toContain("• 1x Boné\n");
    expect(message).not.toContain("📞");
  });
});
