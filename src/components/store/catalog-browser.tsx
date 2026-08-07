"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useState, useTransition } from "react";

type FilterValues = {
  query: string;
  collection: string;
  color: string;
  size: string;
  availability: string;
  minPrice: string;
  maxPrice: string;
  sort: string;
};

type CatalogBrowserProps = {
  children: ReactNode;
  resultCount: number;
  collections: Array<{ name: string; slug: string }>;
  colors: Array<{ name: string; hex: string | null }>;
  sizes: string[];
  values: FilterValues;
};

function SlidersIcon() {
  return (
    <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24">
      <path d="M4 7h10m4 0h2M4 17h2m4 0h10M14 4v6M6 14v6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
    </svg>
  );
}

function ChevronIcon() {
  return <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 20 20"><path d="m6 8 4 4 4-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" /></svg>;
}

function FilterForm({ collections, colors, sizes, values, formId, onSubmit }: Omit<CatalogBrowserProps, "children" | "resultCount"> & { formId: string; onSubmit?: () => void }) {
  const optionClassName = "flex min-h-9 cursor-pointer items-center gap-3 rounded-lg px-2 text-sm font-normal text-black/75 transition-colors hover:bg-black/[0.035] hover:text-black";

  return (
    <form action="/produtos" id={formId} method="get" onSubmit={onSubmit}>
      {values.query ? <input name="q" type="hidden" value={values.query} /> : null}
      {values.sort ? <input name="ordem" type="hidden" value={values.sort} /> : null}

      <div className="divide-y divide-black/10 border-y border-black/10">
        <details className="group py-1" open>
          <summary className="focus-ring flex min-h-14 cursor-pointer list-none items-center justify-between text-sm font-semibold">Coleções <span className="transition-transform group-open:rotate-180"><ChevronIcon /></span></summary>
          <div className="space-y-1 pb-4">
            <label className={optionClassName}><input className="size-4 accent-black" defaultChecked={!values.collection} name="colecao" type="radio" value="" />Todas</label>
            {collections.map((item) => <label className={optionClassName} key={item.slug}><input className="size-4 accent-black" defaultChecked={values.collection === item.slug} name="colecao" type="radio" value={item.slug} />{item.name}</label>)}
          </div>
        </details>

        <details className="group py-1" open={Boolean(values.size)}>
          <summary className="focus-ring flex min-h-14 cursor-pointer list-none items-center justify-between text-sm font-semibold">Tamanho <span className="transition-transform group-open:rotate-180"><ChevronIcon /></span></summary>
          <div className="grid grid-cols-3 gap-2 pb-4">
            {sizes.length ? sizes.map((item) => <label className={`cursor-pointer rounded-lg border px-2 py-2 text-center text-xs font-semibold ${values.size === item ? "border-domary-black bg-domary-black text-white" : "border-black/10"}`} key={item}><input className="sr-only" defaultChecked={values.size === item} name="tamanho" type="radio" value={item} />{item}</label>) : <p className="col-span-3 pb-2 text-xs text-black/40">Nenhum tamanho cadastrado.</p>}
            {values.size ? <label className="cursor-pointer rounded-lg border border-black/10 px-2 py-2 text-center text-xs font-semibold"><input className="sr-only" name="tamanho" type="radio" value="" />Todos</label> : null}
          </div>
        </details>

        <details className="group py-1" open={Boolean(values.color)}>
          <summary className="focus-ring flex min-h-14 cursor-pointer list-none items-center justify-between text-sm font-semibold">Cores <span className="transition-transform group-open:rotate-180"><ChevronIcon /></span></summary>
          <div className="space-y-1 pb-4">
            {colors.length ? colors.map((item) => (
              <label className={optionClassName} key={item.name}>
                <input className="size-4 accent-black" defaultChecked={values.color === item.name} name="cor" type="radio" value={item.name} />
                <span className="size-4 rounded-full border border-black/15" style={{ backgroundColor: item.hex ?? "#d4d4d4" }} />{item.name}
              </label>
            )) : <p className="pb-3 text-xs leading-5 text-black/40">Cadastre cores nas variações para habilitar este filtro.</p>}
            {values.color ? <label className={optionClassName}><input className="size-4 accent-black" name="cor" type="radio" value="" />Todas as cores</label> : null}
          </div>
        </details>

        <details className="group py-1" open={values.minPrice !== "" || values.maxPrice !== ""}>
          <summary className="focus-ring flex min-h-14 cursor-pointer list-none items-center justify-between text-sm font-semibold">Preço <span className="transition-transform group-open:rotate-180"><ChevronIcon /></span></summary>
          <div className="grid grid-cols-2 gap-2 pb-4">
            <label className="text-[10px] font-semibold tracking-wide text-black/45 uppercase">Mínimo<input className="focus-ring mt-1 min-h-11 w-full min-w-0 rounded-lg border border-black/12 px-3 text-sm font-normal" defaultValue={values.minPrice} min="0" name="precoMin" placeholder="R$ 0" step="0.01" type="number" /></label>
            <label className="text-[10px] font-semibold tracking-wide text-black/45 uppercase">Máximo<input className="focus-ring mt-1 min-h-11 w-full min-w-0 rounded-lg border border-black/12 px-3 text-sm font-normal" defaultValue={values.maxPrice} min="0" name="precoMax" placeholder="R$ 500" step="0.01" type="number" /></label>
          </div>
        </details>

        <details className="group py-1" open={Boolean(values.availability)}>
          <summary className="focus-ring flex min-h-14 cursor-pointer list-none items-center justify-between text-sm font-semibold">Disponibilidade <span className="transition-transform group-open:rotate-180"><ChevronIcon /></span></summary>
          <div className="space-y-1 pb-4">
            <label className={optionClassName}><input className="size-4 accent-black" defaultChecked={!values.availability} name="disponibilidade" type="radio" value="" />Todos</label>
            <label className={optionClassName}><input className="size-4 accent-black" defaultChecked={values.availability === "disponivel"} name="disponibilidade" type="radio" value="disponivel" />Em estoque</label>
            <label className={optionClassName}><input className="size-4 accent-black" defaultChecked={values.availability === "esgotado"} name="disponibilidade" type="radio" value="esgotado" />Esgotados</label>
          </div>
        </details>
      </div>

      <button className="focus-ring mt-5 min-h-12 w-full rounded-full bg-domary-yellow px-5 text-sm font-semibold" type="submit">Aplicar filtros</button>
      <Link className="focus-ring mt-2 flex min-h-11 items-center justify-center rounded-full text-xs font-medium text-black/55 underline underline-offset-4" href="/produtos">Limpar tudo</Link>
    </form>
  );
}

export function CatalogBrowser({ children, resultCount, collections, colors, sizes, values }: CatalogBrowserProps) {
  const router = useRouter();
  const [desktopFiltersHidden, setDesktopFiltersHidden] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const activeFilterCount = [values.collection, values.color, values.size, values.availability, values.minPrice || values.maxPrice].filter(Boolean).length;

  function toggleFilters() {
    if (window.matchMedia("(min-width: 1024px)").matches) setDesktopFiltersHidden((current) => !current);
    else setMobileFiltersOpen(true);
  }

  function changeSort(value: string) {
    const params = new URLSearchParams(window.location.search);
    if (value) params.set("ordem", value);
    else params.delete("ordem");
    startTransition(() => router.push(`/produtos${params.size ? `?${params.toString()}` : ""}`, { scroll: false }));
  }

  return (
    <>
      <div className="flex min-w-0 flex-col gap-4 border-y border-black/10 py-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-base font-semibold sm:text-lg">Todos os produtos <span className="font-normal text-black/40">({resultCount})</span></p>
        <div className="flex min-w-0 items-center justify-between gap-2 sm:justify-end sm:gap-5">
          <button aria-expanded={mobileFiltersOpen || !desktopFiltersHidden} className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-full px-2 text-sm font-medium hover:bg-black/[0.035] sm:px-3" onClick={toggleFilters} type="button">Filtros <SlidersIcon />{activeFilterCount ? <span className="grid size-5 place-items-center rounded-full bg-domary-yellow text-[10px] font-semibold">{activeFilterCount}</span> : null}</button>
          <label className={`relative flex min-w-0 items-center gap-1 text-sm font-medium ${isPending ? "opacity-50" : ""}`}>Ordenar por
            <select aria-label="Ordenar produtos" className="focus-ring min-w-0 max-w-36 appearance-none bg-transparent py-3 pl-2 pr-6 text-sm font-normal sm:max-w-none" defaultValue={values.sort} disabled={isPending} onChange={(event) => changeSort(event.target.value)}>
              <option value="">Destaques</option><option value="menor-preco">Menor preço</option><option value="maior-preco">Maior preço</option><option value="nome">Nome: A–Z</option>
            </select>
            <span className="pointer-events-none absolute right-0"><ChevronIcon /></span>
          </label>
        </div>
      </div>

      <div className={`mt-7 min-w-0 gap-7 ${desktopFiltersHidden ? "lg:block" : "lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]"}`}>
        {!desktopFiltersHidden ? <aside className="hidden min-w-0 self-start lg:sticky lg:top-32 lg:block"><FilterForm collections={collections} colors={colors} formId="desktop-catalog-filters" sizes={sizes} values={values} /></aside> : null}
        <div className={`grid min-w-0 grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-3 md:gap-x-4 ${desktopFiltersHidden ? "xl:grid-cols-4" : "xl:grid-cols-3"}`}>{children}</div>
      </div>

      {mobileFiltersOpen ? (
        <div aria-modal="true" className="fixed inset-0 z-[70] bg-black/45 lg:hidden" role="dialog">
          <div className="ml-auto flex h-full w-[min(92vw,25rem)] flex-col overflow-hidden bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-black/10 px-5 py-4"><div><p className="text-lg font-semibold">Filtros</p><p className="text-xs text-black/45">{resultCount} resultados</p></div><button aria-label="Fechar filtros" className="focus-ring grid size-11 place-items-center rounded-full bg-black/5 text-xl font-light" onClick={() => setMobileFiltersOpen(false)} type="button">×</button></div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4"><FilterForm collections={collections} colors={colors} formId="mobile-catalog-filters" onSubmit={() => setMobileFiltersOpen(false)} sizes={sizes} values={values} /></div>
          </div>
        </div>
      ) : null}
    </>
  );
}
