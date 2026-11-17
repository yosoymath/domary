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
  stone: "bg-[#d9d6cc]",
  dark: "bg-[#2a2a28]",
  cream: "bg-[#eae5d8]",
};

export function optimizedCardImageUrl(imageUrl: string) {
  const cloudinaryUploadMarker = "/image/upload/";
  if (!imageUrl.startsWith("https://res.cloudinary.com/") || !imageUrl.includes(cloudinaryUploadMarker)) return imageUrl;

  const [prefix, suffix] = imageUrl.split(cloudinaryUploadMarker);
  if (!prefix || !suffix || !/^v\d+\//.test(suffix)) return imageUrl;

  return `${prefix}${cloudinaryUploadMarker}f_auto,q_auto:eco,c_fill,g_auto,w_720,h_720/${suffix}`;
}

export function ProductShape({ shape }: Pick<ProductCardProps, "shape">) {
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
  const isDiscount = badge?.startsWith("-");

  return (
    <article className="group relative min-w-0">
      {productHref ? <Link aria-label={`Ver detalhes de ${name}`} className="focus-ring absolute inset-0 z-10 rounded-[10px]" href={productHref}><span className="sr-only">Ver detalhes de {name}</span></Link> : null}
      <div className={`relative grid aspect-[4/5] place-items-center overflow-hidden rounded-[6px] ${imageUrl ? "bg-[#e4e3e0]" : toneClasses[tone]}`}>
        {badge ? (
          <span className={`absolute left-3 top-3 z-10 rounded-[3px] px-2 py-1 text-[11px] font-extrabold tracking-wide uppercase ${isDiscount ? "bg-[#111111] text-white" : "bg-domary-yellow text-[#111111]"}`}>{isDiscount ? `${badge.slice(1)} OFF` : badge}</span>
        ) : null}
        {productId ? (
          <form action={toggleFavorite.bind(null, productId, productHref ?? "/")} className="absolute right-3 top-3 z-20">
            <button className={`focus-ring grid size-8 place-items-center rounded-full bg-white/90 text-sm transition-opacity ${isFavorited ? "text-red-600" : "text-[#111111] opacity-0 group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100"}`} aria-label={isFavorited ? `Remover ${name} dos favoritos` : `Adicionar ${name} aos favoritos`} title={isFavorited ? "Remover dos favoritos" : "Adicionar aos favoritos"} type="submit">
              {isFavorited ? "♥" : "♡"}
            </button>
          </form>
        ) : null}
        {imageUrl ? (
          <img
            alt={`Foto de ${name}`}
            className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            decoding="async"
            loading="lazy"
            src={optimizedCardImageUrl(imageUrl)}
          />
        ) : <ProductShape shape={shape} />}
      </div>

      <div className="pt-3 text-center">
        <h3 className="[overflow-wrap:anywhere] text-sm leading-snug font-medium sm:text-[15px]">{name}</h3>
        <p className="mt-0.5 text-xs text-black/45">{category}</p>
        <div className="mt-1.5 flex flex-wrap items-baseline justify-center gap-x-2 gap-y-1">
          {oldPrice ? <span className="text-xs text-black/40 line-through">{oldPrice}</span> : null}
          <span className="text-base font-semibold">{price}</span>
        </div>
      </div>
    </article>
  );
}
