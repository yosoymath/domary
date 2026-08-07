"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth/current-user";

type ProfileField = "name" | "phone";

export type ProfileActionState = {
  status?: "success" | "error";
  message?: string;
  fieldErrors?: Partial<Record<ProfileField, string[]>>;
};

const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe seu nome completo.")
    .max(80, "O nome deve ter no máximo 80 caracteres."),
  phone: z
    .string()
    .trim()
    .refine((value) => {
      if (!value) return true;
      const digits = value.replace(/\D/g, "");
      return digits.length >= 10 && digits.length <= 15;
    }, "Informe um telefone válido com DDD."),
});

function formValue(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === "string" ? value : "";
}

export async function updateProfile(
  _previousState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const user = await requireCurrentUser("/account/profile");
  const parsed = profileSchema.safeParse({
    name: formValue(formData, "name"),
    phone: formValue(formData, "phone"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os campos destacados.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const phoneDigits = parsed.data.phone.replace(/\D/g, "");

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: parsed.data.name,
      phone: phoneDigits || null,
    },
    select: { id: true },
  });

  revalidatePath("/", "layout");
  revalidatePath("/account", "layout");

  return {
    status: "success",
    message: "Perfil atualizado com sucesso.",
  };
}

const productIdSchema = z.string().uuid();

export async function toggleFavorite(productId: string, callbackUrl: string) {
  const safeCallbackUrl = callbackUrl.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : "/";
  const user = await requireCurrentUser(safeCallbackUrl);
  const parsedProductId = productIdSchema.safeParse(productId);

  if (!parsedProductId.success) return;

  const product = await prisma.product.findFirst({
    where: { id: parsedProductId.data, status: "ACTIVE" },
    select: { id: true },
  });

  if (!product) return;

  const existing = await prisma.favorite.findUnique({
    where: {
      userId_productId: { userId: user.id, productId: product.id },
    },
    select: { id: true },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    revalidatePath("/");
    revalidatePath(safeCallbackUrl);
    revalidatePath("/account/favorites");
    return;
  }

  await prisma.favorite.create({
    data: { userId: user.id, productId: product.id },
    select: { id: true },
  });
  revalidatePath("/");
  revalidatePath(safeCallbackUrl);
  revalidatePath("/account/favorites");
}

export async function removeFavorite(formData: FormData) {
  const user = await requireCurrentUser("/account/favorites");
  const parsedProductId = productIdSchema.safeParse(formValue(formData, "productId"));

  if (!parsedProductId.success) return;

  await prisma.favorite.deleteMany({
    where: { userId: user.id, productId: parsedProductId.data },
  });

  revalidatePath("/account");
  revalidatePath("/account/favorites");
}
