import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { hashPasswordResetToken } from "@/lib/auth/password-reset";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Criar nova senha",
  description: "Crie uma nova senha segura para sua conta Domary.",
};

type ResetPasswordPageProps = {
  params: Promise<{ token: string }>;
};

export default async function ResetPasswordPage({ params }: ResetPasswordPageProps) {
  const { token } = await params;
  const validTokenFormat = /^[A-Za-z0-9_-]{40,128}$/.test(token);
  const resetToken = validTokenFormat
    ? await prisma.passwordResetToken.findUnique({
        where: { tokenHash: hashPasswordResetToken(token) },
        select: { expiresAt: true },
      })
    : null;
  const available = Boolean(resetToken && resetToken.expiresAt > new Date());

  return (
    <AuthShell
      description={available ? "Escolha uma senha diferente, segura e fácil de lembrar." : "Este link não está mais disponível. Solicite um novo para recuperar o acesso à sua conta."}
      eyebrow="Segurança da conta"
      title={available ? "Crie sua nova senha" : "Link inválido ou expirado"}
    >
      {available ? (
        <ResetPasswordForm token={token} />
      ) : (
        <div className="rounded-3xl border border-black/10 bg-black/[0.025] p-6 text-center">
          <p className="text-sm leading-6 text-black/55">Por segurança, cada link pode ser usado apenas uma vez e expira depois de 1 hora.</p>
          <Link className="focus-ring mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-domary-yellow px-6 text-sm font-black text-domary-black" href="/forgot-password">Solicitar novo link</Link>
        </div>
      )}
    </AuthShell>
  );
}
