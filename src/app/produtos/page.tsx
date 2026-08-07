import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { CatalogBrowser } from "@/components/store/catalog-browser";
import { ProductCard } from "@/components/store/product-card";
import { getCurrentUser } from "@/lib/auth/current-user";
import { formatCurrency } from "@/lib/formatters";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Todos os produtos",
  description: "Explore roupas e acessórios Domary e filtre por coleção, cor, tamanho, preço e disponibilidade.",
};

type CatalogSearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstParam(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

function searchText(value: string | string[] | undefined) {
  return firstParam(value).slice(0, 100);
}

function moneyValue(value: string | string[] | undefined) {
  const rawValue = firstParam(value);
  if (!rawValue) return undefined;
  const number = Number(rawValue.replace(",", "."));
  return Number.isFinite(number) && number >= 0 && number <= 1_000_000 ? number : undefined;
}

function activePromotionWhere(now: Date): Prisma.PromotionWhereInput {
  return {
    isActive: true,
    AND: [
      { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
      { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
    ],
  };
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24">
      <path d="m21 21-4.35-4.35M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

export default async function ProductsPage({ searchParams }: { searchParams: CatalogSearchParams }) {
  const params = await searchParams;
  const query = searchText(params.q);
  const collection = firstParam(params.colecao || params.categoria);
  const color = searchText(params.cor);
  const size = searchText(params.tamanho);
  const availability = firstParam(params.disponibilidade);
  const sort = firstParam(params.ordem);
  const rawMinPrice = firstParam(params.precoMin);
  const rawMaxPrice = firstParam(params.precoMax);
  const minPrice = moneyValue(params.precoMin);
  const maxPrice = moneyValue(params.precoMax);
  const promotionWhere = activePromotionWhere(new Date());
  const conditions: Prisma.ProductWhereInput[] = [{ status: "ACTIVE" }, { category: { isActive: true } }];

  if (query) {
    conditions.push({
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { category: { name: { contains: query, mode: "insensitive" } } },
        { variants: { some: { isActive: true, color: { contains: query, mode: "insensitive" } } } },
      ],
    });
  }

  if (collection) conditions.push({ category: { slug: collection } });
  if (minPrice !== undefined || maxPrice !== undefined) conditions.push({ price: { gte: minPrice, lte: maxPrice } });

  const variantFilter: Prisma.ProductVariantWhereInput = { isActive: true };
  if (color) variantFilter.color = { equals: color, mode: "insensitive" };
  if (size) variantFilter.size = { equals: size, mode: "insensitive" };
  if (availability === "disponivel") variantFilter.stockQuantity = { gt: 0 };
  if (color || size || availability === "disponivel") conditions.push({ variants: { some: variantFilter } });
  else if (availability === "esgotado") conditions.push({ variants: { none: { isActive: true, stockQuantity: { gt: 0 } } } });

  let orderBy: Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[];
  if (sort === "menor-preco") orderBy = { price: "asc" };
  else if (sort === "maior-preco") orderBy = { price: "desc" };
  else if (sort === "nome") orderBy = { name: "asc" };
  else orderBy = [{ isFeatured: "desc" }, { createdAt: "desc" }];

  const [user, products, collections, colorRows, sizeRows] = await Promise.all([
    getCurrentUser(),
    prisma.product.findMany({
      where: { AND: conditions },
      select: {
        id: true,
        slug: true,
        name: true,
        price: true,
        compareAtPrice: true,
        isFeatured: true,
        images: { orderBy: { position: "asc" }, take: 1, select: { url: true } },
        promotions: { where: promotionWhere, select: { percentage: true } },
        category: { select: { name: true, promotions: { where: promotionWhere, select: { percentage: true } } } },
      },
      orderBy,
    }),
    prisma.category.findMany({ where: { isActive: true, products: { some: { status: "ACTIVE" } } }, select: { name: true, slug: true }, orderBy: { name: "asc" } }),
    prisma.productVariant.findMany({
      where: { isActive: true, color: { not: null }, product: { status: "ACTIVE", category: { isActive: true } } },
      select: { color: true, colorHex: true },
      distinct: ["color"],
      orderBy: { color: "asc" },
    }),
    prisma.productVariant.findMany({
      where: { isActive: true, size: { not: null }, product: { status: "ACTIVE", category: { isActive: true } } },
      select: { size: true },
      distinct: ["size"],
      orderBy: { size: "asc" },
    }),
  ]);
  const colors = colorRows.flatMap((row) => row.color ? [{ name: row.color, hex: row.colorHex }] : []);
  const sizes = sizeRows.map((row) => row.size).filter((value): value is string => Boolean(value));
  const favoriteIds = user && products.length
    ? new Set((await prisma.favorite.findMany({ where: { userId: user.id, productId: { in: products.map((product) => product.id) } }, select: { productId: true } })).map((favorite) => favorite.productId))
    : new Set<string>();
  const tones = ["yellow", "stone", "dark", "cream"] as const;
  const shapes = ["shirt", "bag", "dress", "cap"] as const;

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <nav aria-label="Navegação estrutural" className="flex items-center gap-2 text-xs font-medium text-black/40"><Link className="focus-ring hover:text-black" href="/">Início</Link><span>/</span><span className="text-black/70">Produtos</span></nav>

        <div className="mt-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div><p className="text-xs font-semibold tracking-[0.18em] text-black/40 uppercase">Catálogo Domary</p><h1 className="mt-2 text-4xl font-bold tracking-[-0.045em] sm:text-5xl">Encontre seu estilo</h1></div>
          <p className="max-w-md text-sm leading-6 text-black/50">Pesquise por nome, coleção ou cor e refine os resultados usando os filtros.</p>
        </div>

        <form action="/produtos" className="mt-8" method="get">
          {collection ? <input name="colecao" type="hidden" value={collection} /> : null}
          {color ? <input name="cor" type="hidden" value={color} /> : null}
          {size ? <input name="tamanho" type="hidden" value={size} /> : null}
          {availability ? <input name="disponibilidade" type="hidden" value={availability} /> : null}
          {rawMinPrice ? <input name="precoMin" type="hidden" value={rawMinPrice} /> : null}
          {rawMaxPrice ? <input name="precoMax" type="hidden" value={rawMaxPrice} /> : null}
          {sort ? <input name="ordem" type="hidden" value={sort} /> : null}
          <label className="sr-only" htmlFor="catalog-search">Pesquisar produtos</label>
          <div className="relative max-w-2xl">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-black/40"><SearchIcon /></span>
            <input className="focus-ring min-h-14 w-full rounded-full border border-black/12 bg-domary-cream pl-12 pr-28 text-sm font-normal placeholder:text-black/35" defaultValue={query} id="catalog-search" maxLength={100} name="q" placeholder="Buscar por nome, coleção ou cor" type="search" />
            <button className="focus-ring absolute bottom-1.5 right-1.5 top-1.5 rounded-full bg-domary-black px-5 text-xs font-semibold text-white" type="submit">Buscar</button>
          </div>
        </form>

        <div className="mt-8">
          <CatalogBrowser
            collections={collections}
            colors={colors}
            resultCount={products.length}
            sizes={sizes}
            values={{ query, collection, color, size, availability, minPrice: rawMinPrice, maxPrice: rawMaxPrice, sort }}
          >
            {products.length ? products.map((product, index) => {
              const promotionPercentage = Math.max(0, ...product.promotions.map((promotion) => Number(promotion.percentage)), ...product.category.promotions.map((promotion) => Number(promotion.percentage)));
              const basePrice = Number(product.price);
              const effectivePrice = promotionPercentage ? Math.round(basePrice * (1 - promotionPercentage / 100) * 100) / 100 : basePrice;
              return <ProductCard badge={promotionPercentage ? `-${promotionPercentage}%` : product.isFeatured ? "Destaque" : undefined} category={product.category.name} imageUrl={product.images[0]?.url} isFavorited={favoriteIds.has(product.id)} key={product.id} name={product.name} oldPrice={promotionPercentage ? formatCurrency(product.price) : product.compareAtPrice ? formatCurrency(product.compareAtPrice) : undefined} price={formatCurrency(effectivePrice)} productId={product.id} productSlug={product.slug} shape={shapes[index % shapes.length]} tone={tones[index % tones.length]} />;
            }) : (
              <div className="col-span-full rounded-[2rem] border border-dashed border-black/15 bg-domary-cream px-5 py-16 text-center"><span aria-hidden="true" className="text-6xl font-bold text-domary-yellow">0.</span><h2 className="mt-4 text-2xl font-bold">Nenhum produto encontrado</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-black/50">Tente remover alguns filtros ou pesquisar outro nome, coleção ou cor.</p><Link className="focus-ring mt-7 inline-flex min-h-12 items-center rounded-full bg-domary-black px-7 text-sm font-semibold text-white" href="/produtos">Ver todo o catálogo</Link></div>
            )}
          </CatalogBrowser>
        </div>
      </div>
    </section>
  );
}
