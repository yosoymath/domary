import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { centsToDecimal, effectiveUnitPriceCents, moneyToCents } from "../checkout/pricing";
import { createPagBankSignature, verifyPagBankSignature } from "./signature";
import { parsePagBankPaymentUpdate } from "./webhook";

describe("valores do checkout", () => {
  it("converte reais e aplica a maior promoção em centavos", () => {
    expect(moneyToCents("89.90")).toBe(8_990);
    expect(effectiveUnitPriceCents("89.90", [10, "25.00"])).toBe(6_743);
    expect(centsToDecimal(6_743)).toBe("67.43");
  });

  it("rejeita percentuais inválidos", () => {
    expect(() => effectiveUnitPriceCents("10.00", [101])).toThrow("Percentual");
  });
});

describe("assinatura do webhook PagBank", () => {
  const token = "token-sandbox";
  const body = '{"reference_id":"pedido-1","status":"PAID"}';

  it("gera SHA-256 de token, hífen e corpo bruto", () => {
    const expected = createHash("sha256").update(`${token}-${body}`).digest("hex");
    expect(createPagBankSignature(body, token)).toBe(expected);
    expect(verifyPagBankSignature(body, token, expected)).toBe(true);
  });

  it("rejeita corpo alterado e assinatura malformada", () => {
    const signature = createPagBankSignature(body, token);
    expect(verifyPagBankSignature(`${body} `, token, signature)).toBe(false);
    expect(verifyPagBankSignature(body, token, "inválida")).toBe(false);
  });
});

describe("status recebidos do PagBank", () => {
  it("mapeia uma cobrança paga com valor e método", () => {
    const update = parsePagBankPaymentUpdate({
      reference_id: "pedido-1",
      charges: [{
        id: "CHAR_123",
        status: "PAID",
        paid_at: "2026-08-26T10:00:00-03:00",
        amount: { value: 12_345 },
        payment_method: { type: "PIX" },
      }],
    });

    expect(update).toMatchObject({
      kind: "paid",
      detail: "PAID",
      chargeId: "CHAR_123",
      amountCents: 12_345,
      paymentMethod: "PIX",
    });
    expect(update?.paidAt?.toISOString()).toBe("2026-08-26T13:00:00.000Z");
  });

  it.each([
    ["WAITING", "pending"],
    ["IN_ANALYSIS", "pending"],
    ["DECLINED", "pending"],
    ["CANCELED", "pending"],
    ["EXPIRED", "failed"],
  ] as const)("mapeia %s como %s", (status, kind) => {
    expect(parsePagBankPaymentUpdate({ status })).toMatchObject({ detail: status, kind });
  });

  it("ignora eventos desconhecidos", () => {
    expect(parsePagBankPaymentUpdate({ status: "ACTIVE" })).toBeNull();
  });
});
