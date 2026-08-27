import "server-only";

import { Prisma } from "@prisma/client";
import { centsToDecimal, effectiveUnitPriceCents, moneyToCents } from "@/lib/checkout/pricing";
import { prisma } from "@/lib/prisma";
import type { PagBankPaymentUpdate } from "@/lib/pagbank/webhook";

export type CheckoutCartItem = {
  variantId: string;
  quantity: number;
};

export class CheckoutDomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status = 400,
  ) {
    super(message);
    this.name = "CheckoutDomainError";
  }
}

function mergeCartItems(items: CheckoutCartItem[]) {
  const quantities = new Map<string, number>();

  for (const item of items) {
    const totalQuantity = (quantities.get(item.variantId) ?? 0) + item.quantity;
    if (totalQuantity > 999) {
      throw new CheckoutDomainError("A quantidade de um produto excede o limite permitido.", "INVALID_CART", 400);
    }
    quantities.set(item.variantId, totalQuantity);
  }

  return [...quantities].map(([variantId, quantity]) => ({ variantId, quantity }));
}

function activePromotionWhere(now: Date) {
  return {
    isActive: true,
    AND: [
      { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
      { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
    ],
  } satisfies Prisma.PromotionWhereInput;
}

export async function findCheckoutAttempt(userId: string, checkoutRequestId: string) {
  return prisma.order.findFirst({
    where: { userId, checkoutRequestId },
    select: {
      id: true,
      number: true,
      status: true,
      paymentStatus: true,
      providerCheckoutUrl: true,
    },
  });
}

export async function createPendingCheckoutOrder(
  userId: string,
  checkoutRequestId: string,
  rawItems: CheckoutCartItem[],
  shippingAmountCents: number,
) {
  const items = mergeCartItems(rawItems);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      addresses: {
        select: {
          postalCode: true,
          street: true,
          number: true,
          complement: true,
          district: true,
          city: true,
          state: true,
        },
        orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
        take: 1,
      },
    },
  });

  if (!user) throw new CheckoutDomainError("Sua sessão não é mais válida.", "UNAUTHORIZED", 401);
  const address = user.addresses[0];
  if (!address) {
    throw new CheckoutDomainError(
      "Cadastre um endereço principal antes de finalizar a compra.",
      "ADDRESS_REQUIRED",
      422,
    );
  }

  const now = new Date();
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: items.map((item) => item.variantId) }, isActive: true, product: { status: "ACTIVE" } },
    select: {
      id: true,
      sku: true,
      size: true,
      color: true,
      stockQuantity: true,
      product: {
        select: {
          id: true,
          name: true,
          price: true,
          promotions: { where: activePromotionWhere(now), select: { percentage: true } },
          category: {
            select: { promotions: { where: activePromotionWhere(now), select: { percentage: true } } },
          },
        },
      },
    },
  });

  const variantById = new Map(variants.map((variant) => [variant.id, variant]));
  if (variants.length !== items.length) {
    throw new CheckoutDomainError("Um produto do carrinho não está mais disponível.", "PRODUCT_UNAVAILABLE", 409);
  }

  const preparedItems = items.map((item) => {
    const variant = variantById.get(item.variantId);
    if (!variant) throw new CheckoutDomainError("Produto não encontrado.", "PRODUCT_UNAVAILABLE", 409);
    if (item.quantity > variant.stockQuantity) {
      throw new CheckoutDomainError(
        `Estoque insuficiente para ${variant.product.name}.`,
        "INSUFFICIENT_STOCK",
        409,
      );
    }

    const baseUnitCents = moneyToCents(variant.product.price.toString());
    const promotionPercentages = [
      ...variant.product.promotions.map((promotion) => promotion.percentage.toString()),
      ...variant.product.category.promotions.map((promotion) => promotion.percentage.toString()),
    ];
    const unitPriceCents = effectiveUnitPriceCents(variant.product.price.toString(), promotionPercentages);

    return {
      variant,
      quantity: item.quantity,
      baseUnitCents,
      unitPriceCents,
      totalCents: unitPriceCents * item.quantity,
    };
  });

  const subtotalCents = preparedItems.reduce((sum, item) => sum + item.baseUnitCents * item.quantity, 0);
  const discountedSubtotalCents = preparedItems.reduce((sum, item) => sum + item.totalCents, 0);
  const discountAmountCents = subtotalCents - discountedSubtotalCents;
  const totalCents = discountedSubtotalCents + shippingAmountCents;

  const order = await prisma.$transaction(async (transaction) => {
    for (const item of preparedItems) {
      const updated = await transaction.productVariant.updateMany({
        where: { id: item.variant.id, isActive: true, stockQuantity: { gte: item.quantity } },
        data: { stockQuantity: { decrement: item.quantity } },
      });

      if (updated.count !== 1) {
        throw new CheckoutDomainError(
          `O estoque de ${item.variant.product.name} acabou durante a finalização.`,
          "INSUFFICIENT_STOCK",
          409,
        );
      }
    }

    return transaction.order.create({
      data: {
        userId,
        checkoutRequestId,
        paymentProvider: "PAGBANK",
        subtotal: centsToDecimal(subtotalCents),
        shippingAmount: centsToDecimal(shippingAmountCents),
        discountAmount: centsToDecimal(discountAmountCents),
        total: centsToDecimal(totalCents),
        shippingAddress: address,
        items: {
          create: preparedItems.map((item) => ({
            productId: item.variant.product.id,
            variantId: item.variant.id,
            productName: item.variant.product.name,
            sku: item.variant.sku,
            attributes: { size: item.variant.size, color: item.variant.color },
            unitPrice: centsToDecimal(item.unitPriceCents),
            quantity: item.quantity,
            total: centsToDecimal(item.totalCents),
          })),
        },
      },
      select: {
        id: true,
        number: true,
        total: true,
        items: {
          select: { variantId: true, sku: true, productName: true, unitPrice: true, quantity: true },
        },
      },
    });
  });

  return { order, address };
}

export async function releasePendingOrder(orderId: string, detail: string) {
  return prisma.$transaction(async (transaction) => {
    const order = await transaction.order.findUnique({
      where: { id: orderId },
      select: { id: true, items: { select: { variantId: true, quantity: true } } },
    });
    if (!order) return false;

    const canceled = await transaction.order.updateMany({
      where: { id: orderId, status: "PENDING", paymentStatus: "PENDING" },
      data: { status: "CANCELED", paymentStatus: "FAILED", paymentStatusDetail: detail },
    });
    if (canceled.count !== 1) return false;

    for (const item of order.items) {
      if (item.variantId) {
        await transaction.productVariant.update({
          where: { id: item.variantId },
          data: { stockQuantity: { increment: item.quantity } },
        });
      }
    }

    return true;
  });
}

export async function applyPagBankPaymentUpdate(orderId: string, update: PagBankPaymentUpdate) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, total: true, paymentStatus: true },
  });
  if (!order) return "not_found" as const;

  if (update.kind === "paid") {
    const expectedAmount = moneyToCents(order.total.toString());
    if (update.amountCents !== expectedAmount) {
      throw new CheckoutDomainError("O valor notificado pelo PagBank não corresponde ao pedido.", "AMOUNT_MISMATCH", 400);
    }

    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "CONFIRMED",
        paymentStatus: "PAID",
        paymentStatusDetail: update.detail,
        providerChargeId: update.chargeId,
        paymentMethod: update.paymentMethod,
        paidAt: update.paidAt,
      },
    });
    return "updated" as const;
  }

  if (update.kind === "failed") {
    await prisma.$transaction(async (transaction) => {
      const current = await transaction.order.findUnique({
        where: { id: order.id },
        select: { items: { select: { variantId: true, quantity: true } } },
      });
      if (!current) return;

      const canceled = await transaction.order.updateMany({
        where: { id: order.id, status: "PENDING", paymentStatus: "PENDING" },
        data: {
          status: "CANCELED",
          paymentStatus: "FAILED",
          paymentStatusDetail: update.detail,
          providerChargeId: update.chargeId,
          paymentMethod: update.paymentMethod,
        },
      });
      if (canceled.count !== 1) return;

      for (const item of current.items) {
        if (item.variantId) {
          await transaction.productVariant.update({
            where: { id: item.variantId },
            data: { stockQuantity: { increment: item.quantity } },
          });
        }
      }
    });
    return "updated" as const;
  }

  await prisma.order.updateMany({
    where: { id: order.id, paymentStatus: "PENDING" },
    data: {
      paymentStatusDetail: update.detail,
      providerChargeId: update.chargeId,
      paymentMethod: update.paymentMethod,
    },
  });
  return "updated" as const;
}
