"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/account", label: "Visão geral", icon: "overview" },
  { href: "/account/profile", label: "Perfil", icon: "profile" },
  { href: "/account/orders", label: "Minhas compras", icon: "orders" },
  { href: "/account/favorites", label: "Meus favoritos", icon: "favorites" },
] as const;

type AccountIconProps = {
  name: (typeof links)[number]["icon"];
};

function AccountIcon({ name }: AccountIconProps) {
  if (name === "overview") {
    return (
      <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24">
        <path d="M4 10.75 12 4l8 6.75V20H4v-9.25Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
        <path d="M9.25 20v-5.75h5.5V20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
      </svg>
    );
  }

  if (name === "profile") {
    return (
      <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="8" r="3.25" stroke="currentColor" strokeWidth="1.7" />
        <path d="M5.5 20c.45-3.6 2.62-5.5 6.5-5.5s6.05 1.9 6.5 5.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
      </svg>
    );
  }

  if (name === "orders") {
    return (
      <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24">
        <path d="M5 8.25h14l-.75 11H5.75l-.75-11Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
        <path d="M8.75 9V7.25a3.25 3.25 0 0 1 6.5 0V9" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24">
      <path d="M12 20.25S4.75 16.1 4.75 10.5A3.75 3.75 0 0 1 12 9.1a3.75 3.75 0 0 1 7.25 1.4c0 5.6-7.25 9.75-7.25 9.75Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </svg>
  );
}

export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Navegação da conta">
      <div className="grid grid-cols-2 gap-2 pb-2 lg:flex lg:flex-col lg:pb-0">
        {links.map((item) => {
          const active = pathname === item.href || (item.href !== "/account" && pathname.startsWith(`${item.href}/`));

          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={`focus-ring group relative flex min-h-14 min-w-0 items-center gap-2.5 overflow-hidden rounded-2xl border px-3 py-2.5 text-xs leading-tight font-semibold transition-[color,background-color,border-color] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none sm:text-sm lg:gap-3 lg:px-3 ${active ? "border-domary-yellow/70 bg-white text-black shadow-[0_10px_30px_rgb(0_0_0/0.06)]" : "border-black/8 bg-white/70 text-black/60 hover:border-black/8 hover:bg-black/[0.018] hover:text-black/75 lg:border-transparent lg:bg-transparent lg:hover:border-transparent"}`}
              href={item.href}
              key={item.href}
            >
              <span aria-hidden="true" className={`absolute inset-y-3 left-0 w-1 origin-center rounded-r-full bg-domary-yellow transition-[transform,opacity] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${active ? "scale-y-100 opacity-100" : "scale-y-50 opacity-0 group-hover:scale-y-60 group-hover:opacity-30"}`} />
              <span aria-hidden="true" className={`grid size-9 shrink-0 place-items-center rounded-xl border transition-[color,background-color,border-color] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none lg:size-10 ${active ? "border-domary-yellow bg-domary-yellow text-domary-black shadow-[0_5px_14px_rgb(245_196_0/0.24)]" : "border-black/[0.04] bg-black/[0.035] text-black/55 group-hover:border-domary-yellow/12 group-hover:bg-domary-yellow/[0.07] group-hover:text-black/70"}`}>
                <AccountIcon name={item.icon} />
              </span>
              <span className="min-w-0">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
