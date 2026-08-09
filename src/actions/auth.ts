"use server";

import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { signIn, signOut } from "@/auth";
import { sendWelcomeEmail } from "@/lib/email/send-welcome-email";
import { prisma } from "@/lib/prisma";
import { loginSchema, registerSchema } from "@/lib/validations/auth";

type RegisterField = "name" | "email" | "password" | "confirmPassword";
type LoginField = "email" | "password";

export type RegisterActionState = {
  message?: string;
  fieldErrors?: Partial<Record<RegisterField, string[]>>;
};

export type LoginActionState = {
  message?: string;
  fieldErrors?: Partial<Record<LoginField, string[]>>;
};

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

export async function logout() {
  await signOut({ redirectTo: "/?session=ended" });
}
