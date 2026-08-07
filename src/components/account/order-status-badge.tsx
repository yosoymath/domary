import type { OrderStatus } from "@prisma/client";
import { orderStatusLabel } from "@/lib/formatters";

const statusClass: Record<OrderStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PROCESSING: "bg-violet-100 text-violet-800",
  SHIPPED: "bg-cyan-100 text-cyan-800",
  DELIVERED: "bg-emerald-100 text-emerald-800",
  CANCELED: "bg-red-100 text-red-700",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black ${statusClass[status]}`}>{orderStatusLabel[status]}</span>;
}
