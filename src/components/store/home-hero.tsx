import Link from "next/link";
import { optimizedCardImageUrl, ProductShape } from "@/components/store/product-card";
import styles from "./home-hero.module.css";

export type HomeHeroProduct = {
  name: string;
  href?: string;
  imageUrl?: string;
  shape: "shirt" | "bag" | "dress" | "cap";
};

const ribbonItems = ["Nova coleção", "Retire grátis na loja", "Pague em até 3x", "Trocas em até 30 dias"];

function Ribbon({ className }: { className: string }) {
  const items = [...ribbonItems, ...ribbonItems, ...ribbonItems];
  return (
    <div aria-hidden="true" className={`${styles.ribbon} ${className}`}>
      {[0, 1].map((copy) => (
        <div className={styles.track} key={copy}>
          {items.map((item, index) => <span className={styles.item} key={`${item}-${index}`}>{item}</span>)}
        </div>
      ))}
    </div>
  );
}

function HeroCard({ product, className }: { product: HomeHeroProduct; className: string }) {
  const content = product.imageUrl
    ? <img alt={product.name} decoding="async" src={optimizedCardImageUrl(product.imageUrl)} />
    : <ProductShape shape={product.shape} />;

  return product.href ? (
    <Link aria-label={`Ver ${product.name}`} className={`focus-ring ${styles.card} ${className}`} href={product.href}>{content}</Link>
  ) : (
    <div className={`${styles.card} ${className}`}>{content}</div>
  );
}

export function HomeHero({ products }: { products: HomeHeroProduct[] }) {
  const [left, center, right] = products;

  return (
    <section className={styles.hero} id="novidades">
      <Ribbon className={styles.ribbonTop} />
      <Ribbon className={styles.ribbonGhost} />
      <Ribbon className={styles.ribbonBottom} />

      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-28 pt-32 sm:px-6 md:grid-cols-2 md:pb-32 md:pt-36 lg:px-8">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-[#000000]/60 px-3.5 py-1.5 text-[11px] font-bold tracking-[0.18em] text-white/85 uppercase ring-1 ring-white/10">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-domary-yellow" />
            Coleção atual
          </p>
          <h1 className="display mt-5 text-[clamp(3rem,7vw,5.5rem)] uppercase">
            Vista sua
            <span className="block text-domary-yellow">atitude</span>
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-white/70">
            Roupas e acessórios com <strong className="font-semibold text-white">design marcante</strong> e <strong className="font-semibold text-white">conforto real</strong>. Compre online e retire na loja.
          </p>
          <Link className="btn btn-primary focus-ring mt-8 rounded-full px-7 text-xs font-extrabold tracking-[0.14em] uppercase shadow-[0_10px_30px_color-mix(in_srgb,var(--color-domary-yellow)_35%,transparent)]" href="/produtos">
            Ver a loja <span aria-hidden="true">→</span>
          </Link>
        </div>

        {products.length ? (
          <div className="flex justify-center">
            <div className={styles.cards}>
              {products.length === 2 ? (
                <>
                  <HeroCard className={styles.cardPairBack} product={left} />
                  <HeroCard className={styles.cardPairFront} product={center} />
                </>
              ) : products.length === 1 ? (
                <HeroCard className={styles.cardCenter} product={left} />
              ) : (
                <>
                  <HeroCard className={styles.cardLeft} product={left} />
                  <HeroCard className={styles.cardRight} product={right} />
                  <HeroCard className={styles.cardCenter} product={center} />
                </>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
