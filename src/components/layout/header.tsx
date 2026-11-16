import Link from "next/link";
import { Suspense } from "react";
import { AccountMenu, AccountMenuFallback } from "@/components/layout/account-menu";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { CartIndicator } from "@/components/store/cart-indicator";

function SearchIcon() {
  return (
    <svg aria-hidden="true" className="size-[18px]" fill="none" viewBox="0 0 24 24">
      <path d="m21 21-4.35-4.35M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

const navigation = [
  { href: "/produtos", label: "Loja" },
  { href: "/#categorias", label: "Categorias" },
  { href: "/#produtos", label: "Mais vendidos" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-black/8 bg-domary-cream/90 backdrop-blur-md" data-site-header>
      <div className="mx-auto flex h-16 max-w-7xl min-w-0 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-10">
          <Link aria-label="Domary — página inicial" className="focus-ring shrink-0 text-xl font-bold tracking-[-0.03em]" href="/">
            Domary<span className="text-domary-yellow">.</span>
          </Link>

          <nav aria-label="Navegação principal" className="hidden items-center gap-7 md:flex">
            {navigation.map((item) => (
              <Link className="focus-ring text-sm text-black/60 hover:text-black" href={item.href} key={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <form action="/produtos" className="relative hidden lg:block" method="get" role="search">
            <label className="sr-only" htmlFor="header-search">Buscar produtos</label>
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/40"><SearchIcon /></span>
            <input
              className="focus-ring h-9 w-56 rounded-md bg-black/[0.04] pl-9 pr-3 text-sm placeholder:text-black/40"
              id="header-search"
              maxLength={100}
              name="q"
              placeholder="Buscar"
              type="search"
            />
          </form>
          <Link aria-label="Buscar produtos" className="focus-ring grid size-10 place-items-center rounded-md hover:bg-black/5 lg:hidden" href="/produtos">
            <SearchIcon />
          </Link>
          <ThemeToggle />
          <Suspense fallback={<AccountMenuFallback />}>
            <AccountMenu />
          </Suspense>
          <CartIndicator />
        </div>
      </div>

      <nav aria-label="Navegação móvel" className="no-scrollbar flex gap-6 overflow-x-auto px-4 pb-3 text-sm text-black/60 md:hidden">
        {navigation.map((item) => (
          <Link className="focus-ring shrink-0 hover:text-black" href={item.href} key={item.href}>
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
