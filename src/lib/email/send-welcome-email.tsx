import "server-only";

import { Resend } from "resend";
import { WelcomeEmail } from "@/components/email/welcome-email";

type WelcomeEmailRecipient = {
  name: string;
  email: string;
};

export type WelcomeEmailResult =
  | { status: "sent"; messageId: string }
  | { status: "skipped"; reason: "not-configured" }
  | { status: "failed" };

function appUrl() {
  const configuredUrl = process.env.APP_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  try {
    return new URL(configuredUrl).origin;
  } catch {
    return "http://localhost:3000";
  }
}

export async function sendWelcomeEmail({ name, email }: WelcomeEmailRecipient): Promise<WelcomeEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    if (process.env.NODE_ENV === "production") {
      console.warn("E-mail de boas-vindas não enviado: configuração do provedor ausente.");
    }
    return { status: "skipped", reason: "not-configured" };
  }

  const firstName = name.trim().split(/\s+/)[0]?.slice(0, 50) || "cliente";
  const shopUrl = appUrl();
  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from,
    to: [email],
    subject: `${firstName}, seja bem-vindo à Domary!`,
    react: WelcomeEmail({ firstName, shopUrl }),
    text: [
      `Olá, ${firstName}! Sua conta Domary está pronta.`,
      "",
      "Agora você pode salvar favoritos, acompanhar pedidos e manter seus dados atualizados.",
      `Explore a loja: ${shopUrl}`,
      "",
      "A Domary nunca solicitará sua senha por e-mail.",
    ].join("\n"),
  });

  if (error || !data?.id) {
    console.error("Falha do provedor ao enviar o e-mail de boas-vindas.", error ? { name: error.name } : undefined);
    return { status: "failed" };
  }

  return { status: "sent", messageId: data.id };
}
