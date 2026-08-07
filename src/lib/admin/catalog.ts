import "server-only";

import { requireAdmin } from "@/lib/auth/admin";
import { prisma } from "@/lib/prisma";

export async function getAdminDashboard() {
  await requireAdmin();

  const [products, categories, promotions, orders, lowStockVariants] = await Promise.all([
    prisma.product.count(),
    prisma.category.count(),
    prisma.promotion.count({ where: { isActive: true } }),
    prisma.order.count(),
    prisma.productVariant.count({ where: { isActive: true, stockQuantity: { lte: 5 } } }),
  ]);

  return { products, categories, promotions, orders, lowStockVariants };
}

export async function getAdminProducts() {
  await requireAdmin();

  return prisma.product.findMany({
    include: {
      category: { select: { name: true } },
      images: { orderBy: { position: "asc" }, take: 1 },
      variants: { select: { stockQuantity: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getAdminProduct(id: string) {
  await requireAdmin();

  return prisma.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: { position: "asc" } },
      variants: { orderBy: { position: "asc" } },
    },
  });
}

export async function getAdminCategories() {
  await requireAdmin();

  return prisma.category.findMany({
    include: { _count: { select: { products: true, promotions: true } } },
    orderBy: { name: "asc" },
  });
}

export async function getAdminCategory(id: string) {
  await requireAdmin();

  return prisma.category.findUnique({ where: { id } });
}

export async function getAdminPromotions() {
  await requireAdmin();

  return prisma.promotion.findMany({
    include: { _count: { select: { products: true, categories: true } } },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getAdminPromotion(id: string) {
  await requireAdmin();

  return prisma.promotion.findUnique({
    where: { id },
    include: {
      products: { select: { id: true } },
      categories: { select: { id: true } },
    },
  });
}

export async function getCatalogOptions() {
  await requireAdmin();

  const [categories, products] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, isActive: true } }),
    prisma.product.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, status: true } }),
  ]);

  return { categories, products };
}
