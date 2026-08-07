import Link from "next/link";
import { toggleFavorite } from "@/actions/account";

type ProductCardProps = {
  productId?: string;
  productSlug?: string;
  isFavorited?: boolean;
  badge?: string;
  name: string;
  category: string;
  price: string;
  oldPrice?: string;
  imageUrl?: string;
  tone: "yellow" | "stone" | "dark" | "cream";
  shape: "shirt" | "bag" | "dress" | "cap";
};

const toneClasses = {
  yellow: "bg-domary-yellow",
  stone: "bg-stone-300",
  dark: "bg-zinc-800",
  cream: "bg-[#eae5d8]",
};

function ProductShape({ shape }: Pick<ProductCardProps, "shape">) {
  if (shape === "bag") {
    return (
      <svg aria-hidden="true" className="h-44 w-44 drop-shadow-2xl transition-transform duration-500 group-hover:-rotate-3 group-hover:scale-105" viewBox="0 0 200 200">
        <path d="M49 72h102l13 104H36L49 72Z" fill="#151515" />
        <path d="M70 77V60c0-22 60-22 60 0v17" fill="none" stroke="#151515" strokeWidth="10" />
        <circle cx="75" cy="85" fill="#F5C400" r="5" /><circle cx="125" cy="85" fill="#F5C400" r="5" />
      </svg>
    );
  }

  if (shape === "dress") {
    return (
      <svg aria-hidden="true" className="h-48 w-40 drop-shadow-2xl transition-transform duration-500 group-hover:scale-105" viewBox="0 0 160 210">
        <path d="M61 18 80 30l19-12 18 27-20 15 28 130H35L63 60 43 45l18-27Z" fill="#151515" />
        <path d="M63 60h34" stroke="#F5C400" strokeWidth="5" />
      </svg>
    );
  }

  if (shape === "cap") {
    return (
      <svg aria-hidden="true" className="h-40 w-48 drop-shadow-2xl transition-transform duration-500 group-hover:rotate-3 group-hover:scale-105" viewBox="0 0 220 170">
        <path d="M31 94c8-51 27-75 71-75 49 0 71 27 77 83-40-20-100-19-148-8Z" fill="#151515" />
        <path d="M179 102c-13-2-29-3-47-1 27 1 47 9 62 23 8 8 22-5 13-14-8-8-17-7-28-8Z" fill="#F5C400" />
        <path d="M98 20v74" stroke="#333" strokeWidth="3" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="h-44 w-44 drop-shadow-2xl transition-transform duration-500 group-hover:scale-105" viewBox="0 0 200 200">
      <path d="m64 35 36 12 36-12 34 25-21 36-18-10v91H69V86L51 96 30 60l34-25Z" fill="#151515" />
      <path d="M78 40c3 21 41 21 44 0" fill="none" stroke="#F5C400" strokeWidth="6" />
      <path d="M85 112h30" stroke="#F5C400" strokeWidth="8" />
    </svg>
  );
}

export function ProductCard({ productId, productSlug, isFavorited = false, badge, name, category, price, oldPrice, imageUrl, tone, shape }: ProductCardProps) {
  const productHref = productSlug ? `/produtos/${productSlug}` : undefined;

  return (
    <article className="group relative min-w-0">
      {productHref ? <Link aria-label={`Ver detalhes de ${name}`} className="focus-ring absolute inset-0 z-10 rounded-2xl" href={productHref}><span className="sr-only">Ver detalhes de {name}</span></Link> : null}
      <div className={`relative grid aspect-square place-items-center overflow-hidden rounded-2xl ${imageUrl ? "bg-[#f5f5f5]" : toneClasses[tone]}`}>
        {!imageUrl ? <div className="absolute -right-10 -top-10 size-36 rounded-full border-[24px] border-white/15" /> : null}
        {badge ? <span className="absolute left-4 top-4 z-10 rounded-full bg-white px-3 py-1 text-[10px] font-semibold tracking-wider uppercase shadow-sm">{badge}</span> : null}
        {productId ? (
          <form action={toggleFavorite.bind(null, productId, productHref ?? "/")} className="absolute right-4 top-4 z-20">
            <button className="focus-ring grid size-9 place-items-center rounded-full bg-white/90 text-lg text-red-600 transition-transform hover:scale-110" aria-label={isFavorited ? `Remover ${name} dos favoritos` : `Adicionar ${name} aos favoritos`} title={isFavorited ? "Remover dos favoritos" : "Adicionar aos favoritos"} type="submit">
              {isFavorited ? "♥" : "♡"}
            </button>
          </form>
        ) : null}
        {imageUrl ? (
          <img
            alt={`Foto de ${name}`}
            className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            decoding="async"
            loading="lazy"
            src={imageUrl}
          />
        ) : <ProductShape shape={shape} />}
        <span className="pointer-events-none absolute inset-x-4 bottom-4 z-10 translate-y-20 rounded-full bg-white px-4 py-3 text-center text-xs font-semibold uppercase opacity-0 shadow-lg transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
          Ver produto
        </span>
      </div>

      <div className="px-1 pt-4">
        <p className="text-[11px] font-medium tracking-[0.14em] text-black/45 uppercase">{category}</p>
        <h3 className="mt-1 [overflow-wrap:anywhere] font-semibold leading-snug">{name}</h3>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-bold">{price}</span>
          {oldPrice ? <span className="text-xs text-black/40 line-through">{oldPrice}</span> : null}
        </div>
      </div>
    </article>
  );
}
