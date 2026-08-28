import { describe, expect, it } from "vitest";
import { forgotPasswordSchema, resetPasswordSchema } from "./auth";

describe("recuperação de senha", () => {
  it("normaliza o e-mail usado na solicitação", () => {
    const result = forgotPasswordSchema.parse({ email: "  Cliente@Exemplo.com  " });

    expect(result.email).toBe("cliente@exemplo.com");
  });

  it("aceita um token e uma nova senha válidos", () => {
    const result = resetPasswordSchema.safeParse({
      token: "a".repeat(43),
      password: "NovaSenha123",
      confirmPassword: "NovaSenha123",
    });

    expect(result.success).toBe(true);
  });

  it("rejeita confirmação de senha diferente", () => {
    const result = resetPasswordSchema.safeParse({
      token: "a".repeat(43),
      password: "NovaSenha123",
      confirmPassword: "OutraSenha456",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.confirmPassword).toContain("As senhas não coincidem.");
    }
  });

  it("rejeita tokens fora do formato seguro", () => {
    const result = resetPasswordSchema.safeParse({
      token: "token inválido",
      password: "NovaSenha123",
      confirmPassword: "NovaSenha123",
    });

    expect(result.success).toBe(false);
  });
});
