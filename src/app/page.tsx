import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { ProductCard } from "@/components/store/product-card";
import { BrandMarquee } from "@/components/store/brand-marquee";
import { getCurrentUser } from "@/lib/auth/current-user";
import { formatCurrency } from "@/lib/formatters";
import { prisma } from "@/lib/prisma";

const fallbackProducts = [
  { name: "Camiseta Essential", category: "Roupas", price: "R$ 89,90", oldPrice: "R$ 119,90", badge: "-25%", tone: "yellow" as const, shape: "shirt" as const },
  { name: "Bolsa Urban Mini", category: "Acessórios", price: "R$ 159,90", badge: "Mais vendido", tone: "stone" as const, shape: "bag" as const },
  { name: "Vestido Midi Bold", category: "Roupas", price: "R$ 219,90", tone: "yellow" as const, shape: "dress" as const },
  { name: "Boné Signature", category: "Acessórios", price: "R$ 79,90", tone: "cream" as const, shape: "cap" as const },
];

function ArrowIcon() {
  return (
    <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 24 24">
      <path d="M5 12h14m-5-5 5 5-5 5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

export default async function Home() {
  const now = new Date();
  const activePromotionWhere: Prisma.PromotionWhereInput = {
    isActive: true,
    AND: [
      { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
      { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
    ],
  };
  const [user, catalogProducts, catalogCategories] = await Promise.all([
    getCurrentUser(),
    prisma.product.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        slug: true,
        name: true,
        price: true,
        compareAtPrice: true,
        isFeatured: true,
        images: { orderBy: { position: "asc" }, take: 1, select: { url: true } },
        promotions: { where: activePromotionWhere, select: { percentage: true } },
        category: {
          select: {
            name: true,
            promotions: { where: activePromotionWhere, select: { percentage: true } },
          },
        },
      },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      take: 4,
    }),
    prisma.category.findMany({
      where: { isActive: true, products: { some: { status: "ACTIVE" } } },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        imageUrl: true,
        _count: { select: { products: { where: { status: "ACTIVE" } } } },
      },
      orderBy: { name: "asc" },
      take: 6,
    }),
  ]);
  const favoriteIds = user && catalogProducts.length
    ? new Set((await prisma.favorite.findMany({
        where: { userId: user.id, productId: { in: catalogProducts.map((product) => product.id) } },
        select: { productId: true },
      })).map((favorite) => favorite.productId))
    : new Set<string>();
  const tones = ["yellow", "stone", "dark", "cream"] as const;
  const shapes = ["shirt", "bag", "dress", "cap"] as const;
  const products = catalogProducts.length
    ? catalogProducts.map((product, index) => {
        const promotionPercentage = Math.max(
          0,
          ...product.promotions.map((promotion) => Number(promotion.percentage)),
          ...product.category.promotions.map((promotion) => Number(promotion.percentage)),
        );
        const basePrice = Number(product.price);
        const effectivePrice = promotionPercentage
          ? Math.round(basePrice * (1 - promotionPercentage / 100) * 100) / 100
          : basePrice;

        return {
          productId: product.id,
          productSlug: product.slug,
          isFavorited: favoriteIds.has(product.id),
          name: product.name,
          category: product.category.name,
          price: formatCurrency(effectivePrice),
          oldPrice: promotionPercentage
            ? formatCurrency(product.price)
            : product.compareAtPrice ? formatCurrency(product.compareAtPrice) : undefined,
          imageUrl: product.images[0]?.url,
          badge: promotionPercentage ? `-${promotionPercentage}%` : product.isFeatured ? "Destaque" : undefined,
          tone: tones[index % tones.length],
          shape: shapes[index % shapes.length],
        };
      })
    : fallbackProducts;

  return (
    <>
      <section id="novidades" className="relative isolate overflow-hidden bg-[#111111] text-white">
        <div aria-hidden="true" className="absolute inset-0">
          <img alt="" className="size-full object-cover object-[86%_center] sm:object-[80%_center] lg:object-[70%_center]" decoding="async" fetchPriority="high" src="/media/domary-ice-hero-static.webp" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(17,17,17,0.92)_0%,rgba(17,17,17,0.7)_40%,rgba(17,17,17,0.1)_80%)]" />
        </div>

        <div className="relative mx-auto flex min-h-[560px] max-w-7xl flex-col justify-center px-4 py-20 sm:px-6 lg:min-h-[640px] lg:px-8">
          <p className="eyebrow">Coleção atual</p>
          <h1 className="display mt-5 max-w-2xl text-[clamp(3rem,8vw,6rem)]">
            Vista sua <span className="text-domary-yellow">atitude.</span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-white/70">
            Roupas e acessórios com design marcante e conforto real. Compre online e retire na loja.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-6">
            <Link className="btn btn-primary focus-ring" href="/produtos">Ver a loja</Link>
            <Link className="link-arrow focus-ring text-white/85" href="#categorias">Categorias <ArrowIcon /></Link>
          </div>
        </div>
      </section>

      <section aria-label="Diferenciais Domary" className="border-b border-black/8">
        <ul className="mx-auto grid max-w-7xl gap-4 px-4 py-6 text-sm text-black/60 sm:grid-cols-3 sm:px-6 lg:px-8">
          {["Retirada grátis na loja", "Pagamento seguro em até 3x", "Trocas em até 30 dias"].map((item) => (
            <li className="flex items-center gap-2.5" key={item}>
              <span aria-hidden="true" className="size-1.5 rounded-full bg-domary-yellow" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section id="categorias" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="mb-10 flex items-end justify-between gap-6">
          <h2 className="display text-4xl sm:text-5xl">Categorias</h2>
          <Link className="link-arrow focus-ring text-black/70" href="/produtos">Ver tudo <ArrowIcon /></Link>
        </div>

        {catalogCategories.length ? (
          <div className={`grid gap-4 ${catalogCategories.length === 1 ? "" : catalogCategories.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
            {catalogCategories.map((category) => {
              const productLabel = `${category._count.products} ${category._count.products === 1 ? "produto" : "produtos"}`;

              return (
                <Link
                  className={`focus-ring group relative flex min-h-56 overflow-hidden rounded-[10px] p-6 ${category.imageUrl ? "bg-[#111111] text-white" : "bg-black/[0.035]"}`}
                  href={`/produtos?colecao=${encodeURIComponent(category.slug)}`}
                  key={category.id}
                >
                  {category.imageUrl ? (
                    <>
                      <img alt="" className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-[1.02]" loading="lazy" src={category.imageUrl} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    </>
                  ) : null}

                  <div className="relative mt-auto flex w-full items-end justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="break-words text-xl font-semibold">{category.name}</h3>
                      <p className="mt-1 text-sm opacity-60">{productLabel}</p>
                    </div>
                    <span className="shrink-0 opacity-60 transition-transform duration-300 group-hover:translate-x-1 group-hover:opacity-100"><ArrowIcon /></span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[10px] bg-black/[0.035] px-6 py-16 text-center">
            <h3 className="text-xl font-semibold">O catálogo está sendo preparado</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-black/55">Novas categorias e produtos aparecerão aqui em breve.</p>
          </div>
        )}
      </section>

      <section id="produtos" className="mx-auto max-w-7xl scroll-mt-24 px-4 pb-20 sm:px-6 lg:px-8 lg:pb-24">
        <div className="mb-10 flex items-end justify-between gap-6">
          <h2 className="display text-4xl sm:text-5xl">Mais vendidos</h2>
          <Link className="link-arrow focus-ring text-black/70" href="/produtos">Ver todos <ArrowIcon /></Link>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-6">
          {products.map((product) => <ProductCard {...product} key={product.name} />)}
        </div>
      </section>

      <BrandMarquee />

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <h2 className="display text-4xl sm:text-5xl">Como funciona</h2>
        <ol className="mt-10 grid gap-10 sm:grid-cols-3">
          {[
            ["Escolha", "Filtre por categoria, tamanho e cor e monte o seu carrinho."],
            ["Pague", "Finalize com segurança pelo PagBank, em até 3x no cartão."],
            ["Retire", "Aguarde a confirmação de que o pedido está pronto e retire na loja."],
          ].map(([title, text], index) => (
            <li className="border-t border-black/10 pt-5" key={title}>
              <span className="text-sm text-black/40">0{index + 1}</span>
              <h3 className="mt-3 text-lg font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm leading-6 text-black/55">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-t border-black/8">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 py-16 sm:px-6 md:flex-row md:items-center lg:px-8">
          <div>
            <h2 className="display text-3xl sm:text-4xl">Novidades primeiro.</h2>
            <p className="mt-2 text-sm text-black/55">Crie sua conta para salvar favoritos e acompanhar seus pedidos.</p>
          </div>
          <Link className="btn btn-ink focus-ring" href={user ? "/account" : "/register"}>{user ? "Minha conta" : "Criar conta"}</Link>
        </div>
      </section>
    </>
  );
}
