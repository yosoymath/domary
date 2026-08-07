import Link from "next/link";
import { Suspense } from "react";
import { AccountMenu, AccountMenuFallback } from "@/components/layout/account-menu";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { CartIndicator } from "@/components/store/cart-indicator";

function SearchIcon() {
  return (
    <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24">
      <path d="m21 21-4.35-4.35M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

const navigation = [
  { href: "/#novidades", label: "Novidades" },
  { href: "/#produtos", label: "Mais vendidos" },
  { href: "/#categorias", label: "Categorias" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-domary-cream/95 backdrop-blur" data-site-header>
      <div className="bg-domary-black px-4 py-2 text-center text-[11px] font-medium tracking-[0.16em] text-white uppercase sm:text-xs">
        Frete grátis acima de R$ 299
      </div>

      <div className="mx-auto flex h-16 max-w-7xl min-w-0 items-center justify-between gap-2 px-4 sm:px-6 lg:px-8">
        <Link className="focus-ring shrink-0 text-2xl font-black tracking-[-0.08em] uppercase" href="/" aria-label="Domary — página inicial">
          Domary<span className="text-domary-yellow">.</span>
        </Link>

        <nav aria-label="Navegação principal" className="hidden items-center gap-8 md:flex">
          {navigation.map((item) => (
            <Link className="focus-ring text-sm font-semibold transition-colors hover:text-black/55" href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <Link className="focus-ring grid size-10 place-items-center rounded-full transition-colors hover:bg-black/5" href="/produtos" aria-label="Buscar produtos">
            <SearchIcon />
          </Link>
          <ThemeToggle />
          <Suspense fallback={<AccountMenuFallback />}>
            <AccountMenu />
          </Suspense>
          <CartIndicator />
        </div>
      </div>

      <nav aria-label="Navegação móvel" className="grid grid-cols-3 border-t border-black/5 px-3 py-3 text-center text-[11px] font-medium md:hidden">
        {navigation.map((item) => (
          <Link className="focus-ring min-w-0 rounded-lg px-1 py-1 leading-tight" href={item.href} key={item.href}>
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
