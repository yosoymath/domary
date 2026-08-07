"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutForm } from "@/components/auth/logout-form";

const links = [
  { href: "/admin", label: "Visão geral", icon: "dashboard" },
  { href: "/admin/products", label: "Produtos", icon: "products" },
  { href: "/admin/categories", label: "Categorias", icon: "categories" },
  { href: "/admin/promotions", label: "Promoções", icon: "promotions" },
] as const;

type SidebarIconName = (typeof links)[number]["icon"];

function AdminNavigationIcon({ name }: { name: SidebarIconName }) {
  const paths: Record<SidebarIconName, string> = {
    dashboard: "M4 13h6V4H4v9Zm0 7h6v-4H4v4Zm10 0h6v-9h-6v9Zm0-16v4h6V4h-6Z",
    products: "m8.5 4 1.2 2h4.6l1.2-2 4 2.2-2 4.2V20h-11v-9.6l-2-4.2L8.5 4Z",
    categories: "M4 5.5h6v6H4v-6Zm10 0h6v6h-6v-6ZM4 15h6v4H4v-4Zm10 0h6v4h-6v-4Z",
    promotions: "M19 5 5 19M8.5 9A2.5 2.5 0 1 0 8.5 4a2.5 2.5 0 0 0 0 5Zm7 11a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  };

  return (
    <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 24 24">
      <path d={paths[name]} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </svg>
  );
}

function StoreIcon() {
  return (
    <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 24 24">
      <path d="M14 5h5v5M19 5l-8 8M18 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function AdminSidebar({ name }: { name: string }) {
  const pathname = usePathname();
  const initials = getInitials(name);

  return (
    <aside className="bg-domary-black text-white lg:sticky lg:top-0 lg:flex lg:h-dvh lg:min-h-0 lg:flex-col lg:overflow-y-auto">
      <div className="flex items-center justify-between gap-4 border-b border-white/10 py-5 pl-5 pr-16 lg:px-6 lg:py-6">
        <div className="min-w-0">
          <Link className="focus-ring inline-flex text-2xl font-black tracking-[-0.06em] uppercase" href="/admin">
            Domary<span className="text-domary-yellow">.</span>
          </Link>
          <p className="mt-1 text-[9px] font-bold tracking-[0.2em] text-white/35 uppercase">Painel administrativo</p>
        </div>
        <span className="rounded-full border border-domary-yellow/30 bg-domary-yellow/10 px-2.5 py-1 text-[9px] font-bold tracking-[0.14em] text-domary-yellow uppercase">
          Admin
        </span>
      </div>

      <nav aria-label="Navegação administrativa" className="grid grid-cols-2 gap-2 p-3 lg:flex lg:flex-col lg:px-4 lg:py-5">
        <p className="col-span-2 hidden px-3 pb-1 text-[9px] font-bold tracking-[0.18em] text-white/30 uppercase lg:block">Navegação</p>
        {links.map((link) => {
          const active = link.href === "/admin" ? pathname === link.href : pathname.startsWith(link.href);

          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={`focus-ring flex min-w-0 items-center gap-3 rounded-xl px-3 py-3 text-xs leading-tight font-semibold sm:px-4 sm:text-sm ${
                active ? "bg-domary-yellow text-domary-black shadow-[0_8px_24px_rgb(245_196_0/0.14)]" : "text-white/55 hover:bg-white/[0.06] hover:text-white"
              }`}
              href={link.href}
              key={link.href}
            >
              <span className={`grid size-7 shrink-0 place-items-center rounded-lg ${active ? "bg-black/8" : "bg-white/[0.05]"}`}>
                <AdminNavigationIcon name={link.icon} />
              </span>
              <span className="min-w-0">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3 lg:mt-auto lg:p-4">
        <Link className="focus-ring mb-3 flex min-h-10 items-center justify-center gap-2 rounded-xl text-xs font-semibold text-white/45 hover:bg-white/[0.05] hover:text-white" href="/">
          <StoreIcon />
          Visualizar loja
        </Link>

        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3.5 shadow-[0_18px_50px_rgb(0_0_0/0.18)]">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-domary-yellow text-xs font-black text-domary-black">{initials}</span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{name}</p>
              <p className="mt-0.5 text-[10px] font-medium tracking-wide text-white/35 uppercase">Administrador</p>
            </div>
            <span className="ml-auto size-2 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgb(52_211_153/0.1)]" title="Sessão ativa" />
          </div>
          <LogoutForm variant="admin-sidebar" />
        </div>
      </div>
    </aside>
  );
}
