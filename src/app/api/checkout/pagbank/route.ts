import { Prisma } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/auth";
import {
  CheckoutDomainError,
  createPendingCheckoutOrder,
  findCheckoutAttempt,
  releasePendingOrder,
} from "@/lib/checkout/orders";
import { moneyToCents } from "@/lib/checkout/pricing";
import { prisma } from "@/lib/prisma";
import { createPagBankCheckout, PagBankApiError } from "@/lib/pagbank/client";

export const runtime = "nodejs";

const checkoutSchema = z.object({
  checkoutRequestId: z.string().uuid(),
  items: z.array(z.object({
    variantId: z.string().uuid(),
    quantity: z.number().int().min(1).max(99),
  })).min(1).max(30),
});

function errorResponse(message: string, code: string, status: number) {
  return Response.json({ error: message, code }, { status });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse("Entre na sua conta para continuar.", "UNAUTHORIZED", 401);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return errorResponse("Dados do carrinho inválidos.", "INVALID_BODY", 400);
  }

  const parsed = checkoutSchema.safeParse(payload);
  if (!parsed.success) {
    return errorResponse("Revise os produtos e quantidades do carrinho.", "INVALID_CART", 400);
  }

  try {
    const existing = await findCheckoutAttempt(session.user.id, parsed.data.checkoutRequestId);

    if (existing?.providerCheckoutUrl && existing.paymentStatus === "PENDING") {
      return Response.json({ checkoutUrl: existing.providerCheckoutUrl, orderNumber: existing.number });
    }
    if (existing) {
      const message = existing.status === "CANCELED"
        ? "Essa tentativa foi encerrada. Tente finalizar novamente."
        : "O checkout ainda está sendo criado. Aguarde alguns instantes.";
      return errorResponse(message, existing.status === "CANCELED" ? "RESTART_CHECKOUT" : "CHECKOUT_PROCESSING", 409);
    }

    let pendingOrder;
    try {
      pendingOrder = await createPendingCheckoutOrder(
        session.user.id,
        parsed.data.checkoutRequestId,
        parsed.data.items,
      );
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const concurrent = await findCheckoutAttempt(session.user.id, parsed.data.checkoutRequestId);
        if (concurrent?.providerCheckoutUrl) {
          return Response.json({ checkoutUrl: concurrent.providerCheckoutUrl, orderNumber: concurrent.number });
        }
        return errorResponse("O checkout ainda está sendo criado.", "CHECKOUT_PROCESSING", 409);
      }
      throw error;
    }

    try {
      const checkout = await createPagBankCheckout({
        orderId: pendingOrder.order.id,
        items: pendingOrder.order.items.map((item) => ({
          referenceId: item.variantId ?? item.sku,
          name: item.productName,
          quantity: item.quantity,
          unitAmount: moneyToCents(item.unitPrice.toString()),
        })),
      });

      await prisma.order.update({
        where: { id: pendingOrder.order.id },
        data: { providerCheckoutId: checkout.checkoutId, providerCheckoutUrl: checkout.payUrl },
      });

      return Response.json({ checkoutUrl: checkout.payUrl, orderNumber: pendingOrder.order.number });
    } catch (error) {
      if (error instanceof PagBankApiError && !error.retryable) {
        await releasePendingOrder(pendingOrder.order.id, `CHECKOUT_REJECTED_${error.status ?? "UNKNOWN"}`);
      }
      console.error("Falha ao criar checkout PagBank", error);
      return errorResponse(
        error instanceof PagBankApiError && !error.retryable
          ? "O PagBank não aceitou os dados do checkout. Revise as informações de pagamento e tente novamente."
          : "Não foi possível confirmar a comunicação com o PagBank. Aguarde e tente novamente.",
        error instanceof PagBankApiError && !error.retryable ? "RESTART_CHECKOUT" : "PAGBANK_UNAVAILABLE",
        502,
      );
    }
  } catch (error) {
    if (error instanceof CheckoutDomainError) {
      return errorResponse(error.message, error.code, error.status);
    }
    console.error("Falha ao iniciar checkout", error);
    return errorResponse("Não foi possível iniciar o pagamento agora.", "CHECKOUT_ERROR", 500);
  }
}
