import { removeFavorite } from "@/actions/account";
import { EmptyState } from "@/components/account/empty-state";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { formatCurrency } from "@/lib/formatters";
import { prisma } from "@/lib/prisma";

export default async function FavoritesPage() {
  const user = await requireCurrentUser("/account/favorites");
  const favorites = await prisma.favorite.findMany({
    where: { userId: user.id, product: { status: "ACTIVE" } },
    select: {
      productId: true,
      createdAt: true,
      product: {
        select: {
          name: true,
          price: true,
          category: { select: { name: true } },
          images: { orderBy: { position: "asc" }, take: 1, select: { url: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="mb-6"><p className="text-xs font-black tracking-wider text-black/40 uppercase">Sua seleção</p><h2 className="mt-2 text-3xl font-black">Meus favoritos</h2><p className="mt-2 text-sm text-black/50">Guarde aqui as peças que combinam com você.</p></div>
      {favorites.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {favorites.map(({ product, productId }) => (
            <article className="overflow-hidden rounded-[2rem] border border-black/8 bg-white" key={productId}>
              <div className="relative grid aspect-square place-items-center overflow-hidden bg-[#f5f5f5]">
                {product.images[0]?.url ? <img alt={`Foto de ${product.name}`} className="size-full object-cover" loading="lazy" src={product.images[0].url} /> : <span aria-hidden="true" className="text-6xl font-black text-domary-yellow">D.</span>}
              </div>
              <div className="p-5"><p className="text-[10px] font-black tracking-wider text-black/40 uppercase">{product.category.name}</p><h3 className="mt-1 font-black">{product.name}</h3><p className="mt-2 font-black">{formatCurrency(product.price)}</p>
                <form action={removeFavorite} className="mt-4"><input name="productId" type="hidden" value={productId} /><button className="focus-ring text-xs font-black text-red-600 underline underline-offset-4" type="submit">Remover dos favoritos</button></form>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState actionHref="/#produtos" actionLabel="Descobrir produtos" description="Use o coração nos produtos para montar sua lista e encontrá-los rapidamente depois." symbol="♡" title="Sua lista está vazia" />
      )}
    </div>
  );
}
