import Link from "next/link";
import { deleteCategory } from "@/actions/admin";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { CategoryForm } from "@/components/admin/category-form";
import { DeleteForm } from "@/components/admin/delete-form";
import { ToastFeedback } from "@/components/ui/toast";
import { getAdminCategories } from "@/lib/admin/catalog";

export default async function AdminCategoriesPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [categories, params] = await Promise.all([getAdminCategories(), searchParams]);

  return (
    <>
      <AdminPageHeader eyebrow="Catálogo" title="Categorias" description="Organize os produtos em coleções fáceis de encontrar na vitrine." />
      {params.error === "category-has-products" ? <ToastFeedback message="Esta categoria possui produtos vinculados. Mova os produtos antes de excluí-la." variant="warning" /> : null}

      <div className="grid gap-6 xl:grid-cols-[22rem_minmax(0,1fr)]">
        <div><h2 className="mb-3 text-sm font-black tracking-[0.12em] text-black/40 uppercase">Nova categoria</h2><CategoryForm /></div>
        <div>
          <h2 className="mb-3 text-sm font-black tracking-[0.12em] text-black/40 uppercase">Categorias cadastradas</h2>
          <div className="overflow-hidden rounded-2xl border border-black/8 bg-white shadow-sm">
            {categories.map((category) => (
              <div className="flex flex-col gap-4 border-b border-black/6 p-5 last:border-0 sm:flex-row sm:items-center sm:justify-between" key={category.id}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2"><h3 className="truncate text-sm font-black">{category.name}</h3><span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${category.isActive ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500"}`}>{category.isActive ? "Ativa" : "Inativa"}</span></div>
                  <p className="mt-1 text-xs text-black/40">{category._count.products} produtos · {category._count.promotions} promoções</p>
                </div>
                <div className="flex items-center gap-1"><Link className="focus-ring rounded-xl px-3 py-2 text-xs font-extrabold hover:bg-black/[0.05]" href={`/admin/categories/${category.id}/edit`}>Editar</Link><DeleteForm action={deleteCategory.bind(null, category.id)} itemName={category.name} /></div>
              </div>
            ))}
            {!categories.length ? <div className="px-6 py-14 text-center text-sm text-black/45">Nenhuma categoria cadastrada.</div> : null}
          </div>
        </div>
      </div>
    </>
  );
}
