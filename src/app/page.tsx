import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { ProductCard } from "@/components/store/product-card";
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

function HeroArtwork() {
  return (
    <div className="relative mx-auto h-[360px] w-full max-w-md sm:h-[480px]">
      <div className="absolute left-1/2 top-1/2 size-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-domary-yellow sm:size-80" />
      <div className="absolute left-[10%] top-[14%] size-20 rounded-full border-[14px] border-white/10 sm:size-28" />
      <div className="absolute bottom-[8%] right-[8%] h-24 w-24 rotate-12 border-[18px] border-domary-yellow-light/20 sm:h-32 sm:w-32" />
      <svg aria-label="Ilustração de look Domary" className="absolute inset-0 h-full w-full drop-shadow-[0_30px_30px_rgba(0,0,0,0.35)]" role="img" viewBox="0 0 380 500">
        <circle cx="190" cy="78" fill="#D7A17A" r="42" />
        <path d="M149 68c5-47 82-59 91 0-18-5-25-14-32-28-15 17-35 26-59 28Z" fill="#111" />
        <path d="m134 124 56-25 56 25 42 125-44 15-13-52 13 232H136l13-232-13 52-44-15 42-125Z" fill="#171717" />
        <path d="M134 124c35 31 78 31 112 0" fill="none" stroke="#F5C400" strokeWidth="8" />
        <path d="M153 241h74" stroke="#F5C400" strokeWidth="12" />
        <path d="M163 444v44m54-44v44" stroke="#D7A17A" strokeLinecap="round" strokeWidth="24" />
        <path d="M135 488h44m22 0h44" stroke="#F8F7F2" strokeLinecap="round" strokeWidth="16" />
      </svg>
      <div className="absolute bottom-8 left-0 rotate-[-7deg] rounded-full bg-white px-4 py-2 text-xs font-semibold tracking-wide shadow-xl sm:left-4 sm:text-sm">NOVA COLEÇÃO ✦</div>
    </div>
  );
}

export default async function Home() {
  const user = await getCurrentUser();
  const now = new Date();
  const activePromotionWhere: Prisma.PromotionWhereInput = {
    isActive: true,
    AND: [
      { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
      { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
    ],
  };
  const catalogProducts = await prisma.product.findMany({
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
  });
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
      <section id="novidades" className="overflow-hidden bg-domary-black text-white">
        <div className="mx-auto grid min-h-[650px] max-w-7xl items-center gap-6 px-4 py-14 sm:px-6 md:grid-cols-[1.05fr_0.95fr] md:py-20 lg:px-8">
          <div className="relative z-10">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-2 text-[10px] font-bold tracking-[0.18em] uppercase sm:text-xs">
              <span className="size-2 rounded-full bg-domary-yellow" />
              Drop 01 — Essenciais urbanos
            </div>
            <h1 className="max-w-3xl text-5xl leading-[0.92] font-black tracking-[-0.07em] uppercase sm:text-6xl lg:text-8xl">
              Vista sua <span className="text-domary-yellow">atitude.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/65 sm:text-lg">
              Roupas e acessórios para quem transforma o básico em presença. Design marcante, conforto real e personalidade em cada detalhe.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link className="focus-ring inline-flex items-center justify-center gap-3 rounded-full bg-domary-yellow px-7 py-4 text-sm font-black text-domary-black transition-transform hover:-translate-y-0.5" href="#produtos">
                Comprar agora <ArrowIcon />
              </Link>
              <Link className="focus-ring inline-flex items-center justify-center rounded-full border border-white/30 px-7 py-4 text-sm font-bold transition-colors hover:bg-white hover:text-domary-black" href="#categorias">
                Explorar coleção
              </Link>
            </div>
          </div>

          <HeroArtwork />
        </div>
      </section>

      <section aria-label="Diferenciais Domary" className="border-b border-black/10 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 divide-y divide-black/10 px-4 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-6 lg:px-8">
          {[
            ["01", "Envio rápido", "Para todo o Brasil"],
            ["02", "Compra segura", "Seus dados protegidos"],
            ["03", "Troca fácil", "Até 30 dias"],
          ].map(([number, title, text]) => (
            <div className="flex items-center gap-4 py-6 sm:px-6" key={number}>
              <span className="text-2xl font-black text-domary-yellow">{number}</span>
              <div><p className="text-sm font-semibold">{title}</p><p className="text-xs text-black/50">{text}</p></div>
            </div>
          ))}
        </div>
      </section>

      <section id="categorias" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-end justify-between gap-6">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-black/45 uppercase">Encontre seu estilo</p>
            <h2 className="mt-2 text-4xl font-black tracking-[-0.05em] uppercase sm:text-5xl">Categorias</h2>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Link className="focus-ring group relative min-h-80 overflow-hidden rounded-[2rem] bg-domary-yellow p-7 sm:p-10" href="/produtos?colecao=roupas">
            <div className="absolute -bottom-24 -right-12 size-80 rounded-full bg-white/25 transition-transform duration-500 group-hover:scale-110" />
            <span className="relative text-xs font-semibold tracking-[0.2em] uppercase">Coleção 2026</span>
            <h3 className="relative mt-3 text-5xl font-black tracking-[-0.06em] uppercase sm:text-6xl">Roupas</h3>
            <span className="absolute bottom-8 left-7 inline-flex items-center gap-2 text-sm font-semibold sm:left-10">Explorar <ArrowIcon /></span>
            <svg aria-hidden="true" className="absolute bottom-0 right-3 h-64 w-52 transition-transform duration-500 group-hover:translate-x-2" viewBox="0 0 200 250">
              <path d="m59 24 41 15 41-15 42 30-25 43-22-12v159H64V85L42 97 17 54l42-30Z" fill="#151515" />
              <path d="M76 31c4 27 44 27 48 0" fill="none" stroke="#F5C400" strokeWidth="7" />
            </svg>
          </Link>

          <Link className="focus-ring group relative min-h-80 overflow-hidden rounded-[2rem] bg-domary-black p-7 text-white sm:p-10" href="/produtos?colecao=acessorios">
            <div className="absolute -right-14 -top-16 size-64 rounded-full border-[36px] border-white/5" />
            <span className="relative text-xs font-semibold tracking-[0.2em] text-domary-yellow uppercase">Detalhes que marcam</span>
            <h3 className="relative mt-3 text-5xl font-black tracking-[-0.06em] uppercase sm:text-6xl">Acessórios</h3>
            <span className="absolute bottom-8 left-7 inline-flex items-center gap-2 text-sm font-semibold sm:left-10">Explorar <ArrowIcon /></span>
            <svg aria-hidden="true" className="absolute bottom-1 right-5 h-52 w-52 -rotate-6 transition-transform duration-500 group-hover:rotate-0" viewBox="0 0 200 200">
              <path d="M49 72h102l13 104H36L49 72Z" fill="#F5C400" />
              <path d="M70 77V60c0-22 60-22 60 0v17" fill="none" stroke="#F5C400" strokeWidth="10" />
              <circle cx="75" cy="85" fill="#151515" r="5" /><circle cx="125" cy="85" fill="#151515" r="5" />
            </svg>
          </Link>
        </div>
      </section>

      <section id="produtos" className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mb-10 flex items-end justify-between gap-6">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-black/45 uppercase">Os favoritos da comunidade</p>
              <h2 className="mt-2 text-4xl font-black tracking-[-0.05em] uppercase sm:text-5xl">Mais vendidos</h2>
            </div>
            <Link className="focus-ring hidden items-center gap-2 border-b-2 border-domary-yellow pb-1 text-sm font-semibold sm:inline-flex" href="/produtos">Ver todos <ArrowIcon /></Link>
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-4 md:gap-x-5">
            {products.map((product) => <ProductCard {...product} key={product.name} />)}
          </div>

          <Link className="focus-ring mt-10 flex items-center justify-center gap-2 rounded-full border border-black px-6 py-4 text-sm font-semibold sm:hidden" href="/produtos">Ver todos <ArrowIcon /></Link>
        </div>
      </section>

      <section className="bg-domary-yellow px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase">Entre para a lista</p>
          <h2 className="mt-3 text-4xl font-black tracking-[-0.05em] uppercase sm:text-6xl">Novidades primeiro.<br />Sempre.</h2>
          <p className="mt-4 max-w-xl text-sm leading-6 text-black/65">Receba lançamentos, ofertas exclusivas e conteúdo Domary direto no seu e-mail.</p>
          <form className="mt-8 flex w-full max-w-xl flex-col gap-2 sm:flex-row">
            <label className="sr-only" htmlFor="newsletter-email">Seu melhor e-mail</label>
            <input className="focus-ring min-h-14 flex-1 rounded-full border-2 border-black bg-white px-6 text-sm placeholder:text-black/40" id="newsletter-email" name="email" placeholder="Seu melhor e-mail" type="email" />
            <button className="focus-ring min-h-14 rounded-full bg-domary-black px-7 text-sm font-black text-white transition-transform hover:-translate-y-0.5" type="submit">Quero receber</button>
          </form>
        </div>
      </section>
    </>
  );
}
