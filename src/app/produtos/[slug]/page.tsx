import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { toggleFavorite } from "@/actions/account";
import { ProductCard } from "@/components/store/product-card";
import { ProductPurchasePanel } from "@/components/store/product-purchase-panel";
import { getCurrentUser } from "@/lib/auth/current-user";
import { formatCurrency } from "@/lib/formatters";
import { prisma } from "@/lib/prisma";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

function activePromotionWhere(now: Date): Prisma.PromotionWhereInput {
  return {
    isActive: true,
    AND: [
      { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
      { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
    ],
  };
}

const getProduct = cache(async (slug: string) => {
  const promotionWhere = activePromotionWhere(new Date());

  return prisma.product.findFirst({
    where: { slug, status: "ACTIVE" },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      price: true,
      compareAtPrice: true,
      isFeatured: true,
      categoryId: true,
      category: {
        select: {
          name: true,
          slug: true,
          promotions: { where: promotionWhere, select: { percentage: true } },
        },
      },
      images: { orderBy: { position: "asc" }, select: { id: true, url: true, alt: true } },
      variants: {
        where: { isActive: true },
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        select: { id: true, size: true, color: true, colorHex: true, stockQuantity: true },
      },
      promotions: { where: promotionWhere, select: { percentage: true } },
    },
  });
});

function productPricing(product: NonNullable<Awaited<ReturnType<typeof getProduct>>>) {
  const percentage = Math.max(
    0,
    ...product.promotions.map((promotion) => Number(promotion.percentage)),
    ...product.category.promotions.map((promotion) => Number(promotion.percentage)),
  );
  const basePrice = Number(product.price);
  const price = percentage ? Math.round(basePrice * (1 - percentage / 100) * 100) / 100 : basePrice;
  const oldPrice = percentage ? basePrice : product.compareAtPrice ? Number(product.compareAtPrice) : undefined;

  return { percentage, price, oldPrice };
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) return { title: "Produto não encontrado" };

  return {
    title: product.name,
    description: product.description.slice(0, 160),
    openGraph: {
      title: product.name,
      description: product.description.slice(0, 160),
      images: product.images[0]?.url ? [{ url: product.images[0].url, alt: product.images[0].alt }] : undefined,
    },
  };
}

function GalleryPlaceholder({ name }: { name: string }) {
  return (
    <div className="grid aspect-square place-items-center bg-domary-yellow/20">
      <div className="text-center"><span aria-hidden="true" className="text-7xl font-black text-domary-yellow">D.</span><p className="mt-3 text-xs font-medium text-black/40">Imagem de {name}</p></div>
    </div>
  );
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const [product, user] = await Promise.all([getProduct(slug), getCurrentUser()]);
  if (!product) notFound();

  const pricing = productPricing(product);
  const productPath = `/produtos/${product.slug}`;
  const [favorite, relatedProducts, savedAddress] = await Promise.all([
    user ? prisma.favorite.findUnique({ where: { userId_productId: { userId: user.id, productId: product.id } }, select: { id: true } }) : null,
    prisma.product.findMany({
      where: { status: "ACTIVE", categoryId: product.categoryId, id: { not: product.id } },
      select: {
        id: true,
        slug: true,
        name: true,
        price: true,
        compareAtPrice: true,
        isFeatured: true,
        images: { orderBy: { position: "asc" }, take: 1, select: { url: true } },
        promotions: { where: activePromotionWhere(new Date()), select: { percentage: true } },
        category: { select: { name: true, promotions: { where: activePromotionWhere(new Date()), select: { percentage: true } } } },
      },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      take: 4,
    }),
    user ? prisma.customerAddress.findFirst({
      where: { userId: user.id },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
      select: { postalCode: true },
    }) : null,
  ]);
  const relatedFavoriteIds = user && relatedProducts.length
    ? new Set((await prisma.favorite.findMany({ where: { userId: user.id, productId: { in: relatedProducts.map((item) => item.id) } }, select: { productId: true } })).map((item) => item.productId))
    : new Set<string>();
  const totalStock = product.variants.reduce((total, variant) => total + variant.stockQuantity, 0);

  return (
    <>
      <div className="border-b border-black/8 bg-white">
        <nav aria-label="Navegação estrutural" className="mx-auto flex max-w-7xl min-w-0 items-center gap-2 overflow-hidden px-4 py-4 text-[11px] font-bold text-black/45 sm:px-6 lg:px-8">
          <Link className="focus-ring shrink-0 hover:text-black" href="/">Início</Link><span>/</span>
          <Link className="focus-ring shrink-0 hover:text-black" href={`/#categorias`}>{product.category.name}</Link><span>/</span>
          <span className="truncate text-black">{product.name}</span>
        </nav>
      </div>

      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl min-w-0 gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(20rem,0.7fr)] lg:gap-10 lg:px-8 lg:py-10">
          <div className="min-w-0">
            <div className="-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-2 lg:overflow-visible lg:px-0 lg:pb-0">
              {product.images.length ? product.images.map((image, index) => (
                <figure className="relative aspect-square w-[86vw] max-w-[34rem] shrink-0 snap-center overflow-hidden bg-[#f5f5f5] lg:w-auto lg:max-w-none" key={image.id}>
                  <img alt={image.alt || `${product.name} — foto ${index + 1}`} className="size-full object-cover" decoding="async" fetchPriority={index === 0 ? "high" : "auto"} loading={index === 0 ? "eager" : "lazy"} src={image.url} />
                  <span className="absolute bottom-3 right-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-medium shadow-sm">{index + 1}/{product.images.length}</span>
                </figure>
              )) : <div className="w-[86vw] max-w-[34rem] shrink-0 snap-center lg:w-auto lg:max-w-none"><GalleryPlaceholder name={product.name} /></div>}
            </div>
            {product.images.length > 1 ? <p className="mt-2 text-center text-[10px] font-bold text-black/35 lg:hidden">Deslize para ver mais fotos</p> : null}
          </div>

          <aside className="min-w-0 self-start lg:sticky lg:top-32">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-medium tracking-[0.15em] text-black/45 uppercase">{product.category.name}</p>
                <h1 className="mt-2 text-3xl leading-[1.05] font-bold tracking-[-0.035em] sm:text-4xl">{product.name}</h1>
              </div>
              <form action={toggleFavorite.bind(null, product.id, productPath)}>
                <button aria-label={favorite ? "Remover dos favoritos" : "Salvar nos favoritos"} className="focus-ring grid size-11 shrink-0 place-items-center rounded-full border border-black/12 bg-white text-xl text-red-600 transition-transform hover:scale-105" title={favorite ? "Remover dos favoritos" : "Salvar nos favoritos"} type="submit">{favorite ? "♥" : "♡"}</button>
              </form>
            </div>

            <div className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-2xl font-bold">{formatCurrency(pricing.price)}</span>
              {pricing.oldPrice ? <span className="text-sm text-black/40 line-through">{formatCurrency(pricing.oldPrice)}</span> : null}
              {pricing.percentage ? <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">{pricing.percentage}% OFF</span> : null}
            </div>
            <p className="mt-1 text-xs font-semibold text-black/45">ou 3x de {formatCurrency(pricing.price / 3)} sem juros</p>

            {product.isFeatured ? <div className="mt-5 rounded-xl bg-domary-yellow/15 px-4 py-3 text-xs font-semibold">Destaque Domary · uma das peças favoritas da comunidade</div> : null}
            <p className="mt-6 whitespace-pre-line text-sm leading-6 text-black/65">{product.description}</p>
            <p className={`mt-4 text-xs font-semibold ${totalStock > 0 ? "text-emerald-700" : "text-red-600"}`}>{totalStock > 0 ? `${totalStock} unidades disponíveis` : "Indisponível no momento"}</p>

            <ProductPurchasePanel
              initialPostalCode={savedAddress?.postalCode}
              product={{ id: product.id, slug: product.slug, name: product.name, imageUrl: product.images[0]?.url, unitPrice: pricing.price }}
              variants={product.variants.map((variant) => ({ id: variant.id, size: variant.size, color: variant.color, colorHex: variant.colorHex, stockQuantity: variant.stockQuantity }))}
            />
          </aside>
        </div>
      </section>

      {relatedProducts.length ? (
        <section className="border-t border-black/8 bg-domary-cream">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <p className="text-xs font-semibold tracking-[0.18em] text-black/45 uppercase">Você também pode gostar</p>
            <h2 className="mt-2 text-3xl font-bold tracking-[-0.035em] sm:text-4xl">Mais de {product.category.name}</h2>
            <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-4 md:gap-x-5">
              {relatedProducts.map((item, index) => {
                const itemPercentage = Math.max(0, ...item.promotions.map((promotion) => Number(promotion.percentage)), ...item.category.promotions.map((promotion) => Number(promotion.percentage)));
                const itemBasePrice = Number(item.price);
                const itemPrice = itemPercentage ? Math.round(itemBasePrice * (1 - itemPercentage / 100) * 100) / 100 : itemBasePrice;
                const tones = ["yellow", "stone", "dark", "cream"] as const;
                const shapes = ["shirt", "bag", "dress", "cap"] as const;
                return <ProductCard badge={itemPercentage ? `-${itemPercentage}%` : item.isFeatured ? "Destaque" : undefined} category={item.category.name} imageUrl={item.images[0]?.url} isFavorited={relatedFavoriteIds.has(item.id)} key={item.id} name={item.name} oldPrice={itemPercentage ? formatCurrency(item.price) : item.compareAtPrice ? formatCurrency(item.compareAtPrice) : undefined} price={formatCurrency(itemPrice)} productId={item.id} productSlug={item.slug} shape={shapes[index % shapes.length]} tone={tones[index % tones.length]} />;
              })}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
