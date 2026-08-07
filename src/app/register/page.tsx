import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Criar conta",
  description: "Crie sua conta na Domary.",
};

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <AuthShell
      description="Crie sua conta para acompanhar pedidos e viver a experiência Domary completa."
      eyebrow="Boas-vindas"
      title="Crie sua conta"
    >
      <RegisterForm />
    </AuthShell>
  );
}
