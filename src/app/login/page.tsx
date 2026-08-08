import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { ToastFeedback } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Entre na sua conta Domary.",
};

type LoginPageProps = {
  searchParams: Promise<{
    callbackUrl?: string;
    registered?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();
  if (session?.user) redirect("/");

  const params = await searchParams;

  return (
    <AuthShell
      description="Entre para acompanhar seus pedidos, favoritos e novidades selecionadas para você."
      eyebrow="Área do cliente"
      title="Que bom ter você de volta"
    >
      {params.registered === "1" ? <ToastFeedback message="Conta criada com sucesso. Agora é só entrar." variant="success" /> : null}
      <LoginForm callbackUrl={params.callbackUrl} />
    </AuthShell>
  );
}
