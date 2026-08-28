import "server-only";

import { Resend } from "resend";
import { PasswordResetEmail } from "@/components/email/password-reset-email";

type PasswordResetEmailRecipient = {
  name: string;
  email: string;
  token: string;
};

export type PasswordResetEmailResult =
  | { status: "sent"; messageId: string }
  | { status: "skipped"; reason: "not-configured" }
  | { status: "failed" };

function appUrl() {
  const configuredUrl = (process.env.APP_URL ?? process.env.NEXTAUTH_URL)?.trim();

  if (!configuredUrl) {
    return process.env.NODE_ENV === "production" ? null : "http://localhost:3000";
  }

  try {
    const url = new URL(configuredUrl);

    if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
      return null;
    }

    return url.origin;
  } catch {
    return null;
  }
}

export function isPasswordResetEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.EMAIL_FROM?.trim() && appUrl());
}

export async function sendPasswordResetEmail({ name, email, token }: PasswordResetEmailRecipient): Promise<PasswordResetEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  const resetBaseUrl = appUrl();

  if (!apiKey || !from || !resetBaseUrl) {
    if (process.env.NODE_ENV === "production") {
      console.warn("E-mail de redefinição de senha não enviado: configuração do provedor ausente.");
    }
    return { status: "skipped", reason: "not-configured" };
  }

  const firstName = name.trim().split(/\s+/)[0]?.slice(0, 50) || "cliente";
  const resetUrl = new URL(`/reset-password/${encodeURIComponent(token)}`, resetBaseUrl).toString();
  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from,
    to: [email],
    subject: "Redefina sua senha da Domary",
    react: PasswordResetEmail({ firstName, resetUrl }),
    text: [
      `Olá, ${firstName}.`,
      "",
      "Recebemos uma solicitação para redefinir sua senha da Domary.",
      `Crie uma nova senha em até 1 hora: ${resetUrl}`,
      "",
      "Se você não solicitou esta alteração, ignore esta mensagem.",
      "A Domary nunca solicitará sua senha por e-mail.",
    ].join("\n"),
  });

  if (error || !data?.id) {
    console.error("Falha do provedor ao enviar o e-mail de redefinição de senha.", error ? { name: error.name } : undefined);
    return { status: "failed" };
  }

  return { status: "sent", messageId: data.id };
}
