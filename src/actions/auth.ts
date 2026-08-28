"use server";

import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { signIn, signOut } from "@/auth";
import { createPasswordResetToken, hashPasswordResetToken, PASSWORD_RESET_RESEND_DELAY_MS } from "@/lib/auth/password-reset";
import { isPasswordResetEmailConfigured, sendPasswordResetEmail } from "@/lib/email/send-password-reset-email";
import { sendWelcomeEmail } from "@/lib/email/send-welcome-email";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from "@/lib/validations/auth";

type RegisterField = "name" | "email" | "password" | "confirmPassword";
type LoginField = "email" | "password";
type ForgotPasswordField = "email";
type ResetPasswordField = "password" | "confirmPassword";

export type RegisterActionState = {
  message?: string;
  fieldErrors?: Partial<Record<RegisterField, string[]>>;
};

export type LoginActionState = {
  message?: string;
  fieldErrors?: Partial<Record<LoginField, string[]>>;
};

export type ForgotPasswordActionState = {
  status?: "success" | "error";
  message?: string;
  fieldErrors?: Partial<Record<ForgotPasswordField, string[]>>;
};

export type ResetPasswordActionState = {
  status?: "error";
  message?: string;
  fieldErrors?: Partial<Record<ResetPasswordField, string[]>>;
};

const PASSWORD_RESET_REQUEST_MESSAGE = "Se houver uma conta com esse e-mail, você receberá um link para criar uma nova senha.";

class InvalidPasswordResetTokenError extends Error {}

function formValue(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === "string" ? value : "";
}

function safeRedirectPath(value: string) {
  return value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export async function register(
  _previousState: RegisterActionState,
  formData: FormData,
): Promise<RegisterActionState> {
  const parsed = registerSchema.safeParse({
    name: formValue(formData, "name"),
    email: formValue(formData, "email"),
    password: formValue(formData, "password"),
    confirmPassword: formValue(formData, "confirmPassword"),
  });

  if (!parsed.success) {
    return {
      message: "Revise os campos destacados.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { name, email, password } = parsed.data;

  // bcrypt considera somente os primeiros 72 bytes; rejeitar evita senhas
  // diferentes que poderiam produzir a mesma verificação.
  if (bcrypt.truncates(password)) {
    return {
      message: "Revise os campos destacados.",
      fieldErrors: {
        password: ["A senha é muito longa. Use no máximo 72 bytes."],
      },
    };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    return {
      message: "Não foi possível criar a conta.",
      fieldErrors: { email: ["Este e-mail já está em uso."] },
    };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const user = await prisma.user.create({
      data: { name, email, passwordHash },
      select: { name: true, email: true },
    });

    // O envio acontece depois da resposta para não aumentar o tempo de
    // cadastro. Falhas do provedor não removem nem invalidam a conta criada.
    after(async () => {
      try {
        await sendWelcomeEmail(user);
      } catch (emailError) {
        console.error("Falha inesperada no e-mail de boas-vindas.", emailError instanceof Error ? emailError.message : "Erro desconhecido");
      }
    });
  } catch (error) {
    // A constraint única continua sendo a garantia final contra duas
    // requisições concorrentes com o mesmo e-mail.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        message: "Não foi possível criar a conta.",
        fieldErrors: { email: ["Este e-mail já está em uso."] },
      };
    }

    console.error("Falha ao cadastrar cliente", error);
    return {
      message: "Não foi possível criar sua conta agora. Tente novamente.",
    };
  }

  redirect("/login?registered=1");
}

export async function login(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const parsed = loginSchema.safeParse({
    email: formValue(formData, "email"),
    password: formValue(formData, "password"),
  });

  if (!parsed.success) {
    return {
      message: "Revise os campos destacados.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const redirectTo = safeRedirectPath(formValue(formData, "callbackUrl"));

  try {
    await signIn("credentials", {
      ...parsed.data,
      redirectTo,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        message:
          error.type === "CredentialsSignin"
            ? "E-mail ou senha inválidos."
            : "Não foi possível entrar agora. Tente novamente.",
      };
    }

    // O redirecionamento bem-sucedido do Next.js também usa uma exceção
    // interna de controle de fluxo e precisa continuar até o framework.
    throw error;
  }

  return { message: "Não foi possível entrar agora. Tente novamente." };
}

export async function requestPasswordReset(
  _previousState: ForgotPasswordActionState,
  formData: FormData,
): Promise<ForgotPasswordActionState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formValue(formData, "email"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise o campo destacado.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  if (!isPasswordResetEmailConfigured()) {
    return {
      status: "error",
      message: "O envio de recuperação por e-mail ainda não está configurado. Tente novamente mais tarde.",
    };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      select: {
        id: true,
        name: true,
        email: true,
        passwordResetToken: { select: { createdAt: true } },
      },
    });

    if (!user) {
      return { status: "success", message: PASSWORD_RESET_REQUEST_MESSAGE };
    }

    const now = new Date();
    const resendAvailableAt = user.passwordResetToken
      ? user.passwordResetToken.createdAt.getTime() + PASSWORD_RESET_RESEND_DELAY_MS
      : 0;

    if (resendAvailableAt > now.getTime()) {
      return { status: "success", message: PASSWORD_RESET_REQUEST_MESSAGE };
    }

    const resetToken = createPasswordResetToken(now);
    await prisma.passwordResetToken.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        tokenHash: resetToken.tokenHash,
        expiresAt: resetToken.expiresAt,
      },
      update: {
        tokenHash: resetToken.tokenHash,
        expiresAt: resetToken.expiresAt,
        createdAt: now,
      },
    });

    after(async () => {
      try {
        await sendPasswordResetEmail({ name: user.name, email: user.email, token: resetToken.token });
      } catch (emailError) {
        console.error("Falha inesperada no e-mail de redefinição de senha.", emailError instanceof Error ? emailError.message : "Erro desconhecido");
      }
    });

    return { status: "success", message: PASSWORD_RESET_REQUEST_MESSAGE };
  } catch (error) {
    console.error("Falha ao solicitar redefinição de senha", error);
    return {
      status: "error",
      message: "Não foi possível solicitar a redefinição agora. Tente novamente.",
    };
  }
}

export async function resetPassword(
  _previousState: ResetPasswordActionState,
  formData: FormData,
): Promise<ResetPasswordActionState> {
  const parsed = resetPasswordSchema.safeParse({
    token: formValue(formData, "token"),
    password: formValue(formData, "password"),
    confirmPassword: formValue(formData, "confirmPassword"),
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return {
      status: "error",
      message: fieldErrors.token?.length ? "Este link de redefinição é inválido ou expirou." : "Revise os campos destacados.",
      fieldErrors: {
        password: fieldErrors.password,
        confirmPassword: fieldErrors.confirmPassword,
      },
    };
  }

  if (bcrypt.truncates(parsed.data.password)) {
    return {
      status: "error",
      message: "Revise os campos destacados.",
      fieldErrors: { password: ["A senha é muito longa. Use no máximo 72 bytes."] },
    };
  }

  const tokenHash = hashPasswordResetToken(parsed.data.token);

  try {
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      select: { id: true, userId: true },
    });

    if (!resetToken) {
      return { status: "error", message: "Este link de redefinição é inválido ou expirou." };
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const now = new Date();

    await prisma.$transaction(async (transaction) => {
      const consumed = await transaction.passwordResetToken.deleteMany({
        where: {
          id: resetToken.id,
          tokenHash,
          expiresAt: { gt: now },
        },
      });

      if (consumed.count !== 1) throw new InvalidPasswordResetTokenError();

      await transaction.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      });
    });
  } catch (error) {
    if (error instanceof InvalidPasswordResetTokenError) {
      return { status: "error", message: "Este link de redefinição é inválido ou expirou." };
    }

    console.error("Falha ao redefinir senha", error);
    return { status: "error", message: "Não foi possível criar a nova senha agora. Tente novamente." };
  }

  redirect("/login?passwordReset=1");
}

export async function logout() {
  await signOut({ redirectTo: "/?session=ended" });
}
