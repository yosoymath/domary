import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { getAdminDashboard } from "@/lib/admin/catalog";

export default async function AdminDashboardPage() {
  const metrics = await getAdminDashboard();
  const cards = [
    { label: "Produtos", value: metrics.products, href: "/admin/products", tone: "bg-domary-yellow" },
    { label: "Categorias", value: metrics.categories, href: "/admin/categories", tone: "bg-white" },
    { label: "Promoções ativas", value: metrics.promotions, href: "/admin/promotions", tone: "bg-white" },
    { label: "Pedidos", value: metrics.orders, href: "/account/orders", tone: "bg-domary-black text-white" },
  ];

  return (
    <>
      <AdminPageHeader eyebrow="Dashboard" title="Visão geral" description="Acompanhe o catálogo, o estoque e as campanhas da Domary em um só lugar." />

      <section aria-label="Indicadores do catálogo" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Link className={`focus-ring rounded-2xl border border-black/8 p-6 shadow-sm transition-transform hover:-translate-y-0.5 ${card.tone}`} href={card.href} key={card.label}>
            <p className="text-xs font-black tracking-[0.16em] opacity-50 uppercase">{card.label}</p>
            <p className="mt-4 text-4xl font-black tracking-[-0.05em]">{card.value}</p>
            <p className="mt-5 text-xs font-bold opacity-50">Ver detalhes →</p>
          </Link>
        ))}
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-black/8 bg-white p-6 shadow-sm">
          <p className="text-xs font-black tracking-[0.16em] text-black/35 uppercase">Ações rápidas</p>
          <h2 className="mt-2 text-2xl font-black">Gestão de catálogo</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Link className="focus-ring rounded-2xl bg-domary-yellow px-4 py-5 text-sm font-black" href="/admin/products/new">+ Novo produto</Link>
            <Link className="focus-ring rounded-2xl bg-black/[0.04] px-4 py-5 text-sm font-black" href="/admin/categories">+ Nova categoria</Link>
            <Link className="focus-ring rounded-2xl bg-black/[0.04] px-4 py-5 text-sm font-black" href="/admin/promotions/new">+ Nova promoção</Link>
          </div>
        </div>

        <div className={`rounded-2xl border p-6 shadow-sm ${metrics.lowStockVariants ? "border-amber-300 bg-amber-50" : "border-emerald-200 bg-emerald-50"}`}>
          <p className="text-xs font-black tracking-[0.16em] opacity-45 uppercase">Atenção ao estoque</p>
          <p className="mt-3 text-4xl font-black">{metrics.lowStockVariants}</p>
          <p className="mt-2 text-sm leading-6 opacity-60">Variações ativas possuem cinco unidades ou menos em estoque.</p>
          <Link className="focus-ring mt-5 inline-flex text-sm font-black underline decoration-2 decoration-domary-yellow underline-offset-4" href="/admin/products">Revisar estoque</Link>
        </div>
      </section>
    </>
  );
}
