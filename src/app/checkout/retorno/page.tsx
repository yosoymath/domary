import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { PaymentReturnStatus } from "@/components/store/payment-return-status";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { formatCurrency, orderNumber } from "@/lib/formatters";
import { prisma } from "@/lib/prisma";

type CheckoutReturnPageProps = {
  searchParams: Promise<{ order?: string | string[] }>;
};

const orderIdSchema = z.string().uuid();

const content = {
  PAID: {
    symbol: "✓",
    title: "Pagamento confirmado",
    description: "Recebemos a confirmação do PagBank e seu pedido já entrou na nossa fila.",
    tone: "bg-emerald-100 text-emerald-700",
  },
  PENDING: {
    symbol: "…",
    title: "Aguardando confirmação",
    description: "O PagBank ainda está processando o pagamento. Esta página será atualizada automaticamente.",
    tone: "bg-amber-100 text-amber-700",
  },
  FAILED: {
    symbol: "!",
    title: "Pagamento não concluído",
    description: "O pagamento foi recusado, cancelado ou expirou. Seu estoque reservado já foi liberado.",
    tone: "bg-red-100 text-red-700",
  },
  REFUNDED: {
    symbol: "↩",
    title: "Pagamento reembolsado",
    description: "O reembolso foi registrado. Consulte os detalhes do pedido ou fale com o atendimento.",
    tone: "bg-blue-100 text-blue-700",
  },
  RETRY: {
    symbol: "!",
    title: "Pagamento não concluído",
    description: "Essa tentativa não foi aceita, mas o checkout ainda está disponível. Você pode tentar outro cartão ou escolher outra forma de pagamento.",
    tone: "bg-red-100 text-red-700",
  },
} as const;

export default async function CheckoutReturnPage({ searchParams }: CheckoutReturnPageProps) {
  const user = await requireCurrentUser("/carrinho");
  const rawOrderId = (await searchParams).order;
  const parsedOrderId = orderIdSchema.safeParse(Array.isArray(rawOrderId) ? rawOrderId[0] : rawOrderId);
  if (!parsedOrderId.success) notFound();

  const order = await prisma.order.findFirst({
    where: { id: parsedOrderId.data, userId: user.id, paymentProvider: "PAGBANK" },
    select: { number: true, paymentStatus: true, paymentStatusDetail: true, providerCheckoutUrl: true, total: true },
  });
  if (!order) notFound();

  const canRetry = order.paymentStatus === "PENDING"
    && (order.paymentStatusDetail === "DECLINED" || order.paymentStatusDetail === "CANCELED")
    && Boolean(order.providerCheckoutUrl);
  const state = canRetry ? content.RETRY : content[order.paymentStatus];

  return (
    <section className="mx-auto min-h-[65vh] max-w-3xl px-4 py-14 sm:px-6 lg:py-20">
      <PaymentReturnStatus clearCart={order.paymentStatus === "PAID"} refresh={order.paymentStatus === "PENDING" && !canRetry} />
      <div className="rounded-[2rem] border border-black/8 bg-white p-6 text-center shadow-sm sm:p-10">
        <span aria-hidden="true" className={`mx-auto grid size-20 place-items-center rounded-full text-4xl font-black ${state.tone}`}>{state.symbol}</span>
        <p className="mt-7 text-xs font-black tracking-[0.18em] text-black/40 uppercase">Pedido {orderNumber(order.number)}</p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">{state.title}</h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-black/55">{state.description}</p>
        <p className="mt-5 text-xl font-black">{formatCurrency(order.total)}</p>
        {order.paymentStatus === "PAID" || order.paymentStatus === "PENDING" ? (
          <div className="mx-auto mt-7 max-w-xl rounded-2xl border border-domary-yellow/40 bg-domary-yellow/[0.09] p-4 text-left">
            <p className="text-xs font-black tracking-wider text-black uppercase">Retirada na loja</p>
            <p className="mt-1.5 text-xs leading-5 text-black/60">No momento, esta é a única modalidade disponível. Aguarde a confirmação de que o pedido está pronto antes de ir à loja.</p>
          </div>
        ) : null}
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          {canRetry ? <a className="focus-ring inline-flex min-h-12 items-center justify-center rounded-full bg-domary-yellow px-6 text-sm font-black text-black" href={order.providerCheckoutUrl ?? undefined}>Tentar novamente</a> : null}
          <Link className="focus-ring inline-flex min-h-12 items-center justify-center rounded-full bg-domary-black px-6 text-sm font-black text-white" href={`/account/orders/${order.number}`}>Ver pedido</Link>
          <Link className="focus-ring inline-flex min-h-12 items-center justify-center rounded-full border border-black/12 px-6 text-sm font-black" href="/">Voltar à loja</Link>
        </div>
      </div>
    </section>
  );
}
