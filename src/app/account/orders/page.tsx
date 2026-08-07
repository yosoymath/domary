import Link from "next/link";
import { EmptyState } from "@/components/account/empty-state";
import { OrderStatusBadge } from "@/components/account/order-status-badge";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { formatCurrency, formatDate, orderNumber, paymentStatusLabel } from "@/lib/formatters";
import { prisma } from "@/lib/prisma";

export default async function OrdersPage() {
  const user = await requireCurrentUser("/account/orders");
  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    select: {
      number: true,
      status: true,
      paymentStatus: true,
      total: true,
      createdAt: true,
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="mb-6"><p className="text-xs font-black tracking-wider text-black/40 uppercase">Histórico</p><h2 className="mt-2 text-3xl font-black">Minhas compras</h2><p className="mt-2 text-sm text-black/50">Acompanhe pedidos, pagamentos e entregas em um só lugar.</p></div>
      {orders.length ? (
        <div className="space-y-4">
          {orders.map((order) => (
            <article className="rounded-[2rem] border border-black/8 bg-white p-5 sm:p-6" key={order.number}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div><p className="text-xs font-bold text-black/40">{formatDate(order.createdAt)}</p><h3 className="mt-1 text-xl font-black">Pedido {orderNumber(order.number)}</h3><p className="mt-1 text-sm text-black/45">{order._count.items} {order._count.items === 1 ? "item" : "itens"} · {paymentStatusLabel[order.paymentStatus]}</p></div>
                <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end"><OrderStatusBadge status={order.status} /><span className="text-lg font-black">{formatCurrency(order.total)}</span></div>
              </div>
              <div className="mt-5 border-t border-black/8 pt-4"><Link className="focus-ring inline-flex text-sm font-black underline decoration-domary-yellow decoration-2 underline-offset-4" href={`/account/orders/${order.number}`}>Ver detalhes do pedido</Link></div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState actionHref="/#produtos" actionLabel="Explorar produtos" description="Quando você finalizar uma compra, todos os detalhes e atualizações aparecerão aqui." symbol="▣" title="Nenhuma compra ainda" />
      )}
    </div>
  );
}
