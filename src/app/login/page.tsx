import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

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
      {params.registered === "1" ? (
        <div className="mb-5 rounded-2xl border border-domary-yellow/25 bg-domary-yellow/10 px-4 py-3 text-sm font-semibold text-domary-yellow" role="status">
          Conta criada com sucesso. Agora é só entrar.
        </div>
      ) : null}
      <LoginForm callbackUrl={params.callbackUrl} />
    </AuthShell>
  );
}
