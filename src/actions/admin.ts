"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { prisma } from "@/lib/prisma";
import {
  categorySchema,
  productSchema,
  promotionSchema,
  type AdminActionState,
} from "@/lib/validations/admin";

type ParsedVariant = {
  size: string | null;
  color: string | null;
  colorHex: string | null;
  stockQuantity: number;
};

function formString(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === "string" ? value : "";
}

function formIds(formData: FormData, field: string) {
  return formData.getAll(field).filter((value): value is string => typeof value === "string" && /^[0-9a-f-]{36}$/i.test(value));
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

function skuPart(value: string) {
  return slugify(value).replace(/-/g, "").toUpperCase().slice(0, 18) || "UNICO";
}

function parseVariants(value: string): { data?: ParsedVariant[]; error?: string } {
  if (value.trim().startsWith("[")) {
    let entries: unknown;

    try {
      entries = JSON.parse(value);
    } catch {
      return { error: "Não foi possível interpretar a grade de variações." };
    }

    if (!Array.isArray(entries) || !entries.length) return { error: "Informe ao menos uma variação e seu estoque." };
    if (entries.length > 500) return { error: "A grade não pode ultrapassar 500 variações." };

    const variants: ParsedVariant[] = [];
    const seen = new Set<string>();

    for (const [index, entry] of entries.entries()) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return { error: `A variação ${index + 1} possui dados inválidos.` };

      const raw = entry as Record<string, unknown>;
      const sizeLabel = typeof raw.size === "string" ? raw.size.trim() : null;
      const sizeKey = sizeLabel?.toLocaleLowerCase("pt-BR") ?? "";
      const size = sizeKey === "único" || sizeKey === "unico" || !sizeLabel ? null : sizeLabel;
      const color = typeof raw.color === "string" && raw.color.trim() ? raw.color.trim() : null;
      const colorHex = typeof raw.colorHex === "string" && raw.colorHex.trim() ? raw.colorHex.trim().toUpperCase() : null;
      const stockQuantity = typeof raw.stockQuantity === "number" ? raw.stockQuantity : Number(raw.stockQuantity);

      if (size && size.length > 20) return { error: `O tamanho da variação ${index + 1} é muito longo.` };
      if (color && (color.length < 2 || color.length > 40)) return { error: `O nome da cor da variação ${index + 1} é inválido.` };
      if (colorHex && !color) return { error: `Informe o nome da cor na variação ${index + 1}.` };
      if (colorHex && !/^#[0-9a-f]{6}$/i.test(colorHex)) return { error: `O tom da variação ${index + 1} deve ser uma cor hexadecimal válida.` };
      if (!Number.isInteger(stockQuantity) || stockQuantity < 0 || stockQuantity > 1_000_000) return { error: `O estoque da variação ${index + 1} deve ser um número inteiro entre 0 e 1.000.000.` };

      const key = `${normalizedVariantValue(size)}|${normalizedVariantValue(color)}`;
      if (seen.has(key)) return { error: `A combinação ${size ?? "Único"} / ${color ?? "Sem cor"} foi informada mais de uma vez.` };
      seen.add(key);
      variants.push({ size, color, colorHex, stockQuantity });
    }

    return { data: variants };
  }

  const lines = value
    .split(/[\r\n,]+/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) return { error: "Informe ao menos uma variação no formato P:10." };

  const variants: ParsedVariant[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    const match = line.match(/^(.+?):\s*(\d+)$/);
    if (!match) return { error: `A variação "${line}" deve seguir o formato Tamanho:Estoque.` };

    const label = match[1].trim();
    const stockQuantity = Number(match[2]);
    if (!label || stockQuantity > 1_000_000) return { error: `A variação "${line}" contém valores inválidos.` };

    const parts = label.split("|").map((part) => part.trim());
    if (parts.length > 3 || !parts[0]) return { error: `A variação "${line}" possui um formato inválido.` };

    const sizeLabel = parts[0];
    const sizeKey = sizeLabel.toLocaleLowerCase("pt-BR");
    const color = parts[1] || null;
    const colorHex = parts[2] || null;
    if (colorHex && !color) return { error: `Informe o nome da cor antes do código hexadecimal em "${line}".` };
    if (colorHex && !/^#[0-9a-f]{6}$/i.test(colorHex)) return { error: `A cor hexadecimal em "${line}" deve seguir o formato #111111.` };

    const key = `${sizeKey}|${color?.toLocaleLowerCase("pt-BR") ?? ""}`;
    if (seen.has(key)) return { error: `A variação "${label}" foi informada mais de uma vez.` };
    seen.add(key);

    variants.push({
      size: sizeKey === "único" || sizeKey === "unico" ? null : sizeLabel,
      color,
      colorHex,
      stockQuantity,
    });
  }

  return { data: variants };
}

function normalizedVariantValue(value: string | null) {
  return value?.trim().toLocaleLowerCase("pt-BR") ?? "";
}

function parseImages(value: string): { data?: string[]; error?: string } {
  const urls = value.split(/\r?\n/).map((url) => url.trim()).filter(Boolean);

  for (const url of urls) {
    if (/^\/uploads\/products\/[0-9a-f-]{36}\.(?:jpg|png|webp)$/i.test(url)) continue;

    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error("invalid protocol");
    } catch {
      return { error: `A imagem "${url}" não possui uma URL HTTP válida.` };
    }
  }

  return { data: urls };
}

function revalidateCatalog() {
  revalidatePath("/");
  revalidatePath("/produtos");
  revalidatePath("/produtos/[slug]", "page");
  revalidatePath("/admin", "layout");
}

function mutationError(error: unknown): AdminActionState {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return { status: "error", message: "Já existe um registro usando um desses dados únicos." };
  }

  console.error("Falha em uma operação administrativa", error);
  return { status: "error", message: "Não foi possível salvar as alterações. Tente novamente." };
}

function productPayload(formData: FormData) {
  return productSchema.safeParse({
    name: formString(formData, "name"),
    description: formString(formData, "description"),
    categoryId: formString(formData, "categoryId"),
    price: formString(formData, "price"),
    compareAtPrice: formString(formData, "compareAtPrice"),
    status: formString(formData, "status"),
    isFeatured: formData.get("isFeatured") === "on",
    variants: formString(formData, "variants"),
    images: formString(formData, "images"),
  });
}

export async function createProduct(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  await requireAdmin();
  const parsed = productPayload(formData);

  if (!parsed.success) {
    return { status: "error", message: "Revise os campos destacados.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const variants = parseVariants(parsed.data.variants);
  if (!variants.data) return { status: "error", fieldErrors: { variants: [variants.error ?? "Grade inválida."] } };
  const images = parseImages(parsed.data.images);
  if (!images.data) return { status: "error", fieldErrors: { images: [images.error ?? "Imagens inválidas."] } };

  const slug = slugify(parsed.data.name);
  if (!slug) return { status: "error", fieldErrors: { name: ["O título precisa conter letras ou números."] } };

  try {
    await prisma.product.create({
      data: {
        name: parsed.data.name,
        slug,
        description: parsed.data.description,
        categoryId: parsed.data.categoryId,
        price: parsed.data.price,
        compareAtPrice: parsed.data.compareAtPrice === "" ? null : parsed.data.compareAtPrice,
        status: parsed.data.status,
        isFeatured: parsed.data.isFeatured,
        variants: {
          create: variants.data!.map((variant, position) => ({
            ...variant,
            position,
            sku: `${skuPart(slug)}-${skuPart(variant.size ?? "unico")}-${skuPart(variant.color ?? "padrao")}`,
          })),
        },
        images: {
          create: images.data!.map((url, position) => ({ url, position, alt: parsed.data.name })),
        },
      },
    });
  } catch (error) {
    return mutationError(error);
  }

  revalidateCatalog();
  redirect("/admin/products");
}

export async function updateProduct(id: string, _state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  await requireAdmin();
  const parsed = productPayload(formData);

  if (!parsed.success) {
    return { status: "error", message: "Revise os campos destacados.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const variants = parseVariants(parsed.data.variants);
  if (!variants.data) return { status: "error", fieldErrors: { variants: [variants.error ?? "Grade inválida."] } };
  const images = parseImages(parsed.data.images);
  if (!images.data) return { status: "error", fieldErrors: { images: [images.error ?? "Imagens inválidas."] } };

  const slug = slugify(parsed.data.name);
  if (!slug) return { status: "error", fieldErrors: { name: ["O título precisa conter letras ou números."] } };

  try {
    await prisma.$transaction(async (tx) => {
      await tx.productImage.deleteMany({ where: { productId: id } });
      await tx.productVariant.deleteMany({ where: { productId: id } });
      await tx.product.update({
        where: { id },
        data: {
          name: parsed.data.name,
          slug,
          description: parsed.data.description,
          categoryId: parsed.data.categoryId,
          price: parsed.data.price,
          compareAtPrice: parsed.data.compareAtPrice === "" ? null : parsed.data.compareAtPrice,
          status: parsed.data.status,
          isFeatured: parsed.data.isFeatured,
          variants: {
            create: variants.data!.map((variant, position) => ({
              ...variant,
              position,
              sku: `${skuPart(slug)}-${skuPart(variant.size ?? "unico")}-${skuPart(variant.color ?? "padrao")}`,
            })),
          },
          images: {
            create: images.data!.map((url, position) => ({ url, position, alt: parsed.data.name })),
          },
        },
      });
    });
  } catch (error) {
    return mutationError(error);
  }

  revalidateCatalog();
  redirect("/admin/products");
}

export async function deleteProduct(id: string) {
  await requireAdmin();
  const orderItems = await prisma.orderItem.count({ where: { productId: id } });
  if (orderItems > 0) redirect("/admin/products?error=product-has-orders");

  await prisma.product.delete({ where: { id } });
  revalidateCatalog();
}

function categoryPayload(formData: FormData) {
  return categorySchema.safeParse({
    name: formString(formData, "name"),
    description: formString(formData, "description"),
    imageUrl: formString(formData, "imageUrl"),
    isActive: formData.get("isActive") === "on",
  });
}

export async function createCategory(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  await requireAdmin();
  const parsed = categoryPayload(formData);
  if (!parsed.success) return { status: "error", message: "Revise os campos destacados.", fieldErrors: parsed.error.flatten().fieldErrors };

  try {
    await prisma.category.create({
      data: {
        ...parsed.data,
        imageUrl: parsed.data.imageUrl || null,
        description: parsed.data.description || null,
        slug: slugify(parsed.data.name),
      },
    });
  } catch (error) {
    return mutationError(error);
  }

  revalidateCatalog();
  redirect("/admin/categories");
}

export async function updateCategory(id: string, _state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  await requireAdmin();
  const parsed = categoryPayload(formData);
  if (!parsed.success) return { status: "error", message: "Revise os campos destacados.", fieldErrors: parsed.error.flatten().fieldErrors };

  try {
    await prisma.category.update({
      where: { id },
      data: {
        ...parsed.data,
        imageUrl: parsed.data.imageUrl || null,
        description: parsed.data.description || null,
        slug: slugify(parsed.data.name),
      },
    });
  } catch (error) {
    return mutationError(error);
  }

  revalidateCatalog();
  redirect("/admin/categories");
}

export async function deleteCategory(id: string) {
  await requireAdmin();
  const products = await prisma.product.count({ where: { categoryId: id } });
  if (products > 0) redirect("/admin/categories?error=category-has-products");

  await prisma.category.delete({ where: { id } });
  revalidateCatalog();
}

function promotionPayload(formData: FormData) {
  return promotionSchema.safeParse({
    name: formString(formData, "name"),
    code: formString(formData, "code"),
    description: formString(formData, "description"),
    percentage: formString(formData, "percentage"),
    isActive: formData.get("isActive") === "on",
    startsAt: formString(formData, "startsAt"),
    endsAt: formString(formData, "endsAt"),
  });
}

function parsePromotionDates(startsAt: string, endsAt: string) {
  const start = startsAt ? new Date(startsAt) : null;
  const end = endsAt ? new Date(endsAt) : null;
  if ((start && Number.isNaN(start.valueOf())) || (end && Number.isNaN(end.valueOf()))) return { error: "Informe datas válidas." };
  if (start && end && end <= start) return { error: "A data final precisa ser posterior à data inicial." };
  return { start, end };
}

export async function createPromotion(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  await requireAdmin();
  const parsed = promotionPayload(formData);
  if (!parsed.success) return { status: "error", message: "Revise os campos destacados.", fieldErrors: parsed.error.flatten().fieldErrors };
  const dates = parsePromotionDates(parsed.data.startsAt, parsed.data.endsAt);
  if (dates.error) return { status: "error", message: dates.error };
  const productIds = formIds(formData, "productIds");
  const categoryIds = formIds(formData, "categoryIds");
  if (!productIds.length && !categoryIds.length) {
    return { status: "error", message: "Selecione ao menos um produto ou uma categoria para a promoção." };
  }

  try {
    await prisma.promotion.create({
      data: {
        name: parsed.data.name,
        code: parsed.data.code ? parsed.data.code.toUpperCase() : null,
        description: parsed.data.description || null,
        percentage: parsed.data.percentage,
        isActive: parsed.data.isActive,
        startsAt: dates.start,
        endsAt: dates.end,
        products: { connect: productIds.map((id) => ({ id })) },
        categories: { connect: categoryIds.map((id) => ({ id })) },
      },
    });
  } catch (error) {
    return mutationError(error);
  }

  revalidateCatalog();
  redirect("/admin/promotions");
}

export async function updatePromotion(id: string, _state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  await requireAdmin();
  const parsed = promotionPayload(formData);
  if (!parsed.success) return { status: "error", message: "Revise os campos destacados.", fieldErrors: parsed.error.flatten().fieldErrors };
  const dates = parsePromotionDates(parsed.data.startsAt, parsed.data.endsAt);
  if (dates.error) return { status: "error", message: dates.error };
  const productIds = formIds(formData, "productIds");
  const categoryIds = formIds(formData, "categoryIds");
  if (!productIds.length && !categoryIds.length) {
    return { status: "error", message: "Selecione ao menos um produto ou uma categoria para a promoção." };
  }

  try {
    await prisma.promotion.update({
      where: { id },
      data: {
        name: parsed.data.name,
        code: parsed.data.code ? parsed.data.code.toUpperCase() : null,
        description: parsed.data.description || null,
        percentage: parsed.data.percentage,
        isActive: parsed.data.isActive,
        startsAt: dates.start,
        endsAt: dates.end,
        products: { set: productIds.map((productId) => ({ id: productId })) },
        categories: { set: categoryIds.map((categoryId) => ({ id: categoryId })) },
      },
    });
  } catch (error) {
    return mutationError(error);
  }

  revalidateCatalog();
  redirect("/admin/promotions");
}

export async function deletePromotion(id: string) {
  await requireAdmin();
  await prisma.promotion.delete({ where: { id } });
  revalidateCatalog();
}
