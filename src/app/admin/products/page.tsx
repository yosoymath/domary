import Link from "next/link";
import { deleteProduct } from "@/actions/admin";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DeleteForm } from "@/components/admin/delete-form";
import { ToastFeedback } from "@/components/ui/toast";
import { formatCurrency } from "@/lib/formatters";
import { getAdminProducts } from "@/lib/admin/catalog";

const statusLabel = { DRAFT: "Rascunho", ACTIVE: "Ativo", ARCHIVED: "Arquivado" } as const;

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [products, params] = await Promise.all([getAdminProducts(), searchParams]);

  return (
    <>
      <AdminPageHeader eyebrow="Catálogo" title="Produtos" description="Gerencie preços, imagens, publicação e estoque por tamanho." actionHref="/admin/products/new" actionLabel="Adicionar produto" />

      {params.error === "product-has-orders" ? <ToastFeedback message="Este produto possui pedidos vinculados e não pode ser excluído. Altere seu status para “Arquivado”." variant="warning" /> : null}

      <div className="overflow-hidden rounded-2xl border border-black/8 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] border-collapse text-left">
            <thead className="border-b border-black/8 bg-black/[0.025] text-[11px] font-black tracking-[0.14em] text-black/40 uppercase">
              <tr><th className="px-5 py-4">Produto</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Estoque</th><th className="px-5 py-4">Preço</th><th className="px-5 py-4 text-right">Ações</th></tr>
            </thead>
            <tbody className="divide-y divide-black/6">
              {products.map((product) => {
                const stock = product.variants.reduce((total, variant) => total + variant.stockQuantity, 0);
                const image = product.images[0];

                return (
                  <tr className="transition-colors hover:bg-black/[0.015]" key={product.id}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {image ? <img alt={image.alt} className="size-12 rounded-xl object-cover" height="48" src={image.url} width="48" /> : <span className="grid size-12 place-items-center rounded-xl bg-domary-yellow text-sm font-black">{product.name.slice(0, 2).toUpperCase()}</span>}
                        <div><p className="max-w-64 truncate text-sm font-extrabold">{product.name}</p><p className="mt-0.5 text-xs text-black/40">{product.category.name}</p></div>
                      </div>
                    </td>
                    <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${product.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : product.status === "ARCHIVED" ? "bg-zinc-100 text-zinc-600" : "bg-amber-100 text-amber-700"}`}>{statusLabel[product.status]}</span></td>
                    <td className="px-5 py-4"><p className={`text-sm font-black ${stock <= 5 ? "text-red-600" : ""}`}>{stock}</p><p className="text-[11px] text-black/35">{product.variants.length} variações</p></td>
                    <td className="px-5 py-4"><p className="text-sm font-black">{formatCurrency(product.price)}</p>{product.compareAtPrice ? <p className="text-[11px] text-black/35 line-through">{formatCurrency(product.compareAtPrice)}</p> : null}</td>
                    <td className="px-5 py-4"><div className="flex justify-end gap-1"><Link className="focus-ring rounded-xl px-3 py-2 text-xs font-extrabold transition-colors hover:bg-black/[0.05]" href={`/admin/products/${product.id}/edit`}>Editar</Link><DeleteForm action={deleteProduct.bind(null, product.id)} itemName={product.name} /></div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!products.length ? <div className="px-6 py-16 text-center"><p className="text-lg font-black">Nenhum produto cadastrado</p><p className="mt-2 text-sm text-black/45">Adicione a primeira peça para começar o catálogo.</p></div> : null}
      </div>
    </>
  );
}
