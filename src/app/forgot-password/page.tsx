import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Recuperar senha",
  description: "Solicite um link seguro para criar uma nova senha da sua conta Domary.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      description="Informe o e-mail da sua conta. Se ele estiver cadastrado, enviaremos um link seguro com validade de 1 hora."
      eyebrow="Recuperação de acesso"
      title="Esqueceu sua senha?"
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
