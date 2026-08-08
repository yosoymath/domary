"use server";

import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { addressSchema, onlyDigits, passwordSchema, profileSchema } from "@/lib/validations/account";

type ProfileField = "name" | "email" | "phone" | "cpf" | "birthDate" | "gender";
type AddressField = "addressId" | "label" | "postalCode" | "street" | "number" | "complement" | "district" | "city" | "state" | "isPrimary";
type PasswordField = "currentPassword" | "newPassword" | "confirmPassword";

export type ProfileActionState = {
  status?: "success" | "error";
  message?: string;
  fieldErrors?: Partial<Record<ProfileField, string[]>>;
};

export type AddressActionState = {
  status?: "success" | "error";
  message?: string;
  savedAddressId?: string;
  fieldErrors?: Partial<Record<AddressField, string[]>>;
};

export type PasswordActionState = {
  status?: "success" | "error";
  message?: string;
  fieldErrors?: Partial<Record<PasswordField, string[]>>;
};

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
    email: formValue(formData, "email"),
    phone: formValue(formData, "phone"),
    cpf: formValue(formData, "cpf"),
    birthDate: formValue(formData, "birthDate"),
    gender: formValue(formData, "gender"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os campos destacados.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        phone: onlyDigits(parsed.data.phone) || null,
        cpf: onlyDigits(parsed.data.cpf) || null,
        birthDate: parsed.data.birthDate ? new Date(`${parsed.data.birthDate}T00:00:00.000Z`) : null,
        gender: parsed.data.gender || null,
      },
      select: { id: true },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const target = Array.isArray(error.meta?.target) ? error.meta.target.join(" ") : String(error.meta?.target ?? "");
      const field = target.includes("cpf") ? "cpf" : "email";
      return {
        status: "error",
        message: "Não foi possível salvar os dados.",
        fieldErrors: { [field]: [field === "cpf" ? "Este CPF já está cadastrado." : "Este e-mail já está em uso."] },
      };
    }

    console.error("Falha ao atualizar perfil", error);
    return { status: "error", message: "Não foi possível atualizar seu perfil agora. Tente novamente." };
  }

  revalidatePath("/", "layout");
  revalidatePath("/account", "layout");

  return {
    status: "success",
    message: "Perfil atualizado com sucesso.",
  };
}

export async function saveAddress(
  _previousState: AddressActionState,
  formData: FormData,
): Promise<AddressActionState> {
  const user = await requireCurrentUser("/account/profile");
  const parsed = addressSchema.safeParse({
    addressId: formValue(formData, "addressId"),
    label: formValue(formData, "label"),
    postalCode: formValue(formData, "postalCode"),
    street: formValue(formData, "street"),
    number: formValue(formData, "number"),
    complement: formValue(formData, "complement"),
    district: formValue(formData, "district"),
    city: formValue(formData, "city"),
    state: formValue(formData, "state"),
    isPrimary: formData.get("isPrimary") === "on",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os campos destacados.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { addressId, isPrimary, ...values } = parsed.data;
  const data = {
    ...values,
    postalCode: onlyDigits(values.postalCode),
    complement: values.complement || null,
  };

  try {
    let savedAddressId = addressId;

    if (addressId) {
      const existing = await prisma.customerAddress.findFirst({
        where: { id: addressId, userId: user.id },
        select: { id: true, isPrimary: true },
      });

      if (!existing) return { status: "error", message: "Endereço não encontrado." };

      await prisma.$transaction(async (transaction) => {
        if (isPrimary) {
          await transaction.customerAddress.updateMany({ where: { userId: user.id, id: { not: addressId } }, data: { isPrimary: false } });
          await transaction.customerAddress.update({ where: { id: addressId }, data: { ...data, isPrimary: true } });
          return;
        }

        if (existing.isPrimary) {
          const replacement = await transaction.customerAddress.findFirst({
            where: { userId: user.id, id: { not: addressId } },
            select: { id: true },
            orderBy: { createdAt: "asc" },
          });
          await transaction.customerAddress.update({ where: { id: addressId }, data: { ...data, isPrimary: !replacement } });
          if (replacement) await transaction.customerAddress.update({ where: { id: replacement.id }, data: { isPrimary: true } });
          return;
        }

        await transaction.customerAddress.update({ where: { id: addressId }, data: { ...data, isPrimary: false } });
      });
    } else {
      const addressCount = await prisma.customerAddress.count({ where: { userId: user.id } });
      const shouldBePrimary = isPrimary || addressCount === 0;

      const created = await prisma.$transaction(async (transaction) => {
        if (shouldBePrimary) {
          await transaction.customerAddress.updateMany({ where: { userId: user.id }, data: { isPrimary: false } });
        }
        return transaction.customerAddress.create({
          data: { ...data, userId: user.id, isPrimary: shouldBePrimary },
          select: { id: true },
        });
      });
      savedAddressId = created.id;
    }

    revalidatePath("/account/profile");
    revalidatePath("/account");
    return { status: "success", message: addressId ? "Endereço atualizado com sucesso." : "Endereço adicionado com sucesso.", savedAddressId };
  } catch (error) {
    console.error("Falha ao salvar endereço", error);
    return { status: "error", message: "Não foi possível salvar o endereço agora. Tente novamente." };
  }
}

export async function deleteAddress(
  _previousState: AddressActionState,
  formData: FormData,
): Promise<AddressActionState> {
  const user = await requireCurrentUser("/account/profile");
  const parsedId = z.string().uuid().safeParse(formValue(formData, "addressId"));
  if (!parsedId.success) return { status: "error", message: "Endereço inválido." };

  try {
    const address = await prisma.customerAddress.findFirst({
      where: { id: parsedId.data, userId: user.id },
      select: { id: true, isPrimary: true },
    });
    if (!address) return { status: "error", message: "Endereço não encontrado." };

    await prisma.$transaction(async (transaction) => {
      await transaction.customerAddress.deleteMany({ where: { id: address.id, userId: user.id } });
      if (address.isPrimary) {
        const replacement = await transaction.customerAddress.findFirst({
          where: { userId: user.id },
          select: { id: true },
          orderBy: { createdAt: "asc" },
        });
        if (replacement) await transaction.customerAddress.update({ where: { id: replacement.id }, data: { isPrimary: true } });
      }
    });

    revalidatePath("/account/profile");
    revalidatePath("/account");
    return { status: "success", message: "Endereço removido com sucesso." };
  } catch (error) {
    console.error("Falha ao remover endereço", error);
    return { status: "error", message: "Não foi possível remover o endereço agora. Tente novamente." };
  }
}

export async function changePassword(
  _previousState: PasswordActionState,
  formData: FormData,
): Promise<PasswordActionState> {
  const user = await requireCurrentUser("/account/profile");
  const parsed = passwordSchema.safeParse({
    currentPassword: formValue(formData, "currentPassword"),
    newPassword: formValue(formData, "newPassword"),
    confirmPassword: formValue(formData, "confirmPassword"),
  });

  if (!parsed.success) {
    return { status: "error", message: "Revise os campos destacados.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  if (bcrypt.truncates(parsed.data.currentPassword) || bcrypt.truncates(parsed.data.newPassword)) {
    const field = bcrypt.truncates(parsed.data.currentPassword) ? "currentPassword" : "newPassword";
    return { status: "error", message: "Revise os campos destacados.", fieldErrors: { [field]: ["A senha é muito longa. Use no máximo 72 bytes."] } };
  }

  const credentials = await prisma.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } });
  if (!credentials) {
    return { status: "error", message: "Não foi possível atualizar sua senha agora." };
  }

  if (!(await bcrypt.compare(parsed.data.currentPassword, credentials.passwordHash))) {
    return { status: "error", message: "Revise os campos destacados.", fieldErrors: { currentPassword: ["A senha atual está incorreta."] } };
  }

  if (await bcrypt.compare(parsed.data.newPassword, credentials.passwordHash)) {
    return { status: "error", message: "Revise os campos destacados.", fieldErrors: { newPassword: ["Escolha uma senha diferente da atual."] } };
  }

  try {
    const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash }, select: { id: true } });
    return { status: "success", message: "Senha alterada com sucesso." };
  } catch (error) {
    console.error("Falha ao alterar senha", error);
    return { status: "error", message: "Não foi possível alterar sua senha agora. Tente novamente." };
  }
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
