import Link from "next/link";
import { OrderStatusBadge } from "@/components/account/order-status-badge";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { formatCurrency, formatDate, orderNumber } from "@/lib/formatters";
import { prisma } from "@/lib/prisma";

export default async function AccountPage() {
  const user = await requireCurrentUser("/account");
  const [orderCount, favoriteCount, addressCount, recentOrders] = await Promise.all([
    prisma.order.count({ where: { userId: user.id } }),
    prisma.favorite.count({ where: { userId: user.id } }),
    prisma.customerAddress.count({ where: { userId: user.id } }),
    prisma.order.findMany({
      where: { userId: user.id },
      select: { number: true, status: true, total: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Pedidos", value: orderCount, href: "/account/orders" },
          { label: "Favoritos", value: favoriteCount, href: "/account/favorites" },
          { label: "Perfil", value: user.phone && user.cpf && user.birthDate && addressCount ? "Completo" : "Pendente", href: "/account/profile" },
        ].map((item) => (
          <Link className="focus-ring rounded-3xl border border-black/8 bg-white p-5 transition hover:-translate-y-0.5 hover:border-domary-yellow" href={item.href} key={item.label}>
            <p className="text-xs font-black tracking-wider text-black/40 uppercase">{item.label}</p>
            <p className="mt-2 text-2xl font-black">{item.value}</p>
          </Link>
        ))}
      </div>

      <div className="rounded-[2rem] border border-black/8 bg-white p-5 sm:p-7">
        <div className="flex items-center justify-between gap-4">
          <div><p className="text-xs font-black tracking-wider text-black/40 uppercase">Atividade</p><h2 className="mt-1 text-2xl font-black">Pedidos recentes</h2></div>
          <Link className="focus-ring text-sm font-black underline decoration-domary-yellow decoration-2 underline-offset-4" href="/account/orders">Ver todos</Link>
        </div>

        {recentOrders.length ? (
          <div className="mt-6 divide-y divide-black/8">
            {recentOrders.map((order) => (
              <Link className="focus-ring flex flex-col gap-3 py-4 transition hover:bg-black/[0.015] sm:flex-row sm:items-center sm:justify-between" href={`/account/orders/${order.number}`} key={order.number}>
                <div><p className="font-black">Pedido {orderNumber(order.number)}</p><p className="mt-1 text-xs text-black/45">{formatDate(order.createdAt)}</p></div>
                <div className="flex items-center justify-between gap-4 sm:justify-end"><OrderStatusBadge status={order.status} /><span className="font-black">{formatCurrency(order.total)}</span></div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl bg-black/[0.025] px-5 py-8 text-center text-sm text-black/50">Seus pedidos aparecerão aqui depois da primeira compra.</div>
        )}
      </div>

      <div className="rounded-[2rem] bg-domary-black p-6 text-white sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-8">
        <div><p className="text-xs font-black tracking-wider text-domary-yellow uppercase">Dados atualizados, entrega tranquila</p><h2 className="mt-2 text-2xl font-black">Complete seu perfil</h2><p className="mt-2 text-sm text-white/55">Mantenha seu telefone atualizado para facilitar o acompanhamento das entregas.</p></div>
        <Link className="focus-ring mt-5 inline-flex shrink-0 rounded-full bg-domary-yellow px-6 py-3 text-sm font-black text-domary-black sm:mt-0" href="/account/profile">Atualizar dados</Link>
      </div>
    </div>
  );
}
