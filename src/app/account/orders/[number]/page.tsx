import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderStatusBadge } from "@/components/account/order-status-badge";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { formatCurrency, formatDate, orderNumber, paymentStatusLabel } from "@/lib/formatters";
import { prisma } from "@/lib/prisma";

type OrderDetailPageProps = {
  params: Promise<{ number: string }>;
};

function addressLines(value: Prisma.JsonValue) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];

  const address = value as Prisma.JsonObject;
  const read = (key: string) => {
    const field = address[key];
    return typeof field === "string" ? field : "";
  };
  const street = [read("street"), read("number")].filter(Boolean).join(", ");
  const complement = read("complement");
  const district = read("district");
  const cityState = [read("city"), read("state")].filter(Boolean).join(" - ");
  const zipCode = read("zipCode") || read("postalCode");

  return [street, complement, district, cityState, zipCode].filter(Boolean);
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { number } = await params;
  const user = await requireCurrentUser(`/account/orders/${number}`);
  const parsedNumber = Number(number);

  if (!Number.isSafeInteger(parsedNumber) || parsedNumber <= 0) notFound();

  const order = await prisma.order.findFirst({
    where: { number: parsedNumber, userId: user.id },
    select: {
      number: true,
      status: true,
      paymentStatus: true,
      subtotal: true,
      shippingAmount: true,
      discountAmount: true,
      total: true,
      shippingAddress: true,
      customerNote: true,
      createdAt: true,
      items: {
        select: {
          id: true,
          productName: true,
          sku: true,
          attributes: true,
          unitPrice: true,
          quantity: true,
          total: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!order) notFound();

  const shippingLines = addressLines(order.shippingAddress);

  return (
    <div className="space-y-5">
      <Link className="focus-ring inline-flex text-sm font-black underline decoration-domary-yellow decoration-2 underline-offset-4" href="/account/orders">← Voltar para minhas compras</Link>

      <div className="rounded-[2rem] border border-black/8 bg-white p-5 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div><p className="text-xs font-black tracking-wider text-black/40 uppercase">Realizado em {formatDate(order.createdAt)}</p><h2 className="mt-2 text-3xl font-black">Pedido {orderNumber(order.number)}</h2><p className="mt-2 text-sm text-black/50">{paymentStatusLabel[order.paymentStatus]}</p></div>
          <OrderStatusBadge status={order.status} />
        </div>

        <div className="mt-8 divide-y divide-black/8 border-y border-black/8">
          {order.items.map((item) => (
            <div className="grid grid-cols-[4rem_minmax(0,1fr)] gap-3 py-5 sm:grid-cols-[5rem_minmax(0,1fr)_auto] sm:gap-4" key={item.id}>
              <div className="grid size-16 place-items-center rounded-2xl bg-domary-yellow/20 text-xl font-black text-domary-yellow sm:size-20 sm:text-2xl">D.</div>
              <div className="min-w-0"><h3 className="[overflow-wrap:anywhere] font-black">{item.productName}</h3><p className="mt-1 [overflow-wrap:anywhere] text-xs text-black/45">SKU {item.sku} · Quantidade: {item.quantity}</p><p className="mt-2 text-sm text-black/50">{formatCurrency(item.unitPrice)} cada</p></div>
              <p className="col-span-2 text-right font-black sm:col-auto sm:text-left">{formatCurrency(item.total)}</p>
            </div>
          ))}
        </div>

        <div className="ml-auto mt-6 max-w-sm space-y-3 text-sm">
          <div className="flex justify-between gap-5 text-black/55"><span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
          <div className="flex justify-between gap-5 text-black/55"><span>Frete</span><span>{formatCurrency(order.shippingAmount)}</span></div>
          {Number(order.discountAmount) > 0 ? <div className="flex justify-between gap-5 text-emerald-700"><span>Desconto</span><span>- {formatCurrency(order.discountAmount)}</span></div> : null}
          <div className="flex justify-between gap-5 border-t border-black/10 pt-3 text-lg font-black"><span>Total</span><span>{formatCurrency(order.total)}</span></div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="rounded-[2rem] border border-black/8 bg-white p-6"><p className="text-xs font-black tracking-wider text-black/40 uppercase">Entrega</p><h3 className="mt-2 text-lg font-black">Endereço de envio</h3>{shippingLines.length ? <div className="mt-3 space-y-1 text-sm leading-6 text-black/55">{shippingLines.map((line) => <p key={line}>{line}</p>)}</div> : <p className="mt-3 text-sm text-black/45">Endereço registrado no momento da compra.</p>}</div>
        <div className="rounded-[2rem] border border-black/8 bg-white p-6"><p className="text-xs font-black tracking-wider text-black/40 uppercase">Ajuda</p><h3 className="mt-2 text-lg font-black">Precisa falar sobre este pedido?</h3><p className="mt-3 text-sm leading-6 text-black/55">Tenha o número {orderNumber(order.number)} em mãos ao entrar em contato com o atendimento.</p>{order.customerNote ? <p className="mt-3 rounded-xl bg-black/[0.03] p-3 text-xs text-black/55">Observação: {order.customerNote}</p> : null}</div>
      </div>
    </div>
  );
}
