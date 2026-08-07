import Link from "next/link";
import { deletePromotion } from "@/actions/admin";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DeleteForm } from "@/components/admin/delete-form";
import { formatDate } from "@/lib/formatters";
import { getAdminPromotions } from "@/lib/admin/catalog";

function promotionStatus(promotion: { isActive: boolean; startsAt: Date | null; endsAt: Date | null }) {
  const now = new Date();
  if (!promotion.isActive) return { label: "Inativa", className: "bg-zinc-100 text-zinc-500" };
  if (promotion.startsAt && promotion.startsAt > now) return { label: "Agendada", className: "bg-blue-100 text-blue-700" };
  if (promotion.endsAt && promotion.endsAt < now) return { label: "Encerrada", className: "bg-amber-100 text-amber-700" };
  return { label: "Ativa", className: "bg-emerald-100 text-emerald-700" };
}

export default async function AdminPromotionsPage() {
  const promotions = await getAdminPromotions();

  return (
    <>
      <AdminPageHeader eyebrow="Marketing" title="Promoções" description="Crie descontos por produto ou categoria e controle seu período de vigência." actionHref="/admin/promotions/new" actionLabel="Criar promoção" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {promotions.map((promotion) => {
          const status = promotionStatus(promotion);
          return (
            <article className="rounded-2xl border border-black/8 bg-white p-5 shadow-sm" key={promotion.id}>
              <div className="flex items-start justify-between gap-4"><div className="grid size-14 place-items-center rounded-2xl bg-domary-yellow text-xl font-black">-{Number(promotion.percentage)}%</div><span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase ${status.className}`}>{status.label}</span></div>
              <h2 className="mt-5 text-lg font-black">{promotion.name}</h2>
              <p className="mt-1 text-xs text-black/40">{promotion.code ? `Código: ${promotion.code}` : "Desconto automático"}</p>
              <p className="mt-4 text-xs leading-5 text-black/50">{promotion._count.products} produtos · {promotion._count.categories} categorias</p>
              <p className="text-xs leading-5 text-black/40">{promotion.startsAt ? formatDate(promotion.startsAt) : "Início imediato"} → {promotion.endsAt ? formatDate(promotion.endsAt) : "Sem término"}</p>
              <div className="mt-5 flex items-center justify-end gap-1 border-t border-black/6 pt-3"><Link className="focus-ring rounded-xl px-3 py-2 text-xs font-extrabold hover:bg-black/[0.05]" href={`/admin/promotions/${promotion.id}/edit`}>Editar</Link><DeleteForm action={deletePromotion.bind(null, promotion.id)} itemName={promotion.name} /></div>
            </article>
          );
        })}
      </div>
      {!promotions.length ? <div className="rounded-2xl border border-dashed border-black/15 bg-white px-6 py-16 text-center"><p className="text-lg font-black">Nenhuma promoção criada</p><p className="mt-2 text-sm text-black/45">Crie uma campanha para produtos ou categorias específicas.</p></div> : null}
    </>
  );
}
