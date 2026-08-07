"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutForm } from "@/components/auth/logout-form";

type AccountMenuUser = {
  name: string;
  email: string;
  role: "CUSTOMER" | "ADMIN";
};

type AccountMenuClientProps = {
  user: AccountMenuUser;
  initials: string;
  firstName: string;
};

const accountLinks = [
  { href: "/account", label: "Visão geral", description: "Resumo da sua conta" },
  { href: "/account/profile", label: "Perfil", description: "Seus dados pessoais" },
  { href: "/account/orders", label: "Minhas compras", description: "Pedidos e entregas" },
  { href: "/account/favorites", label: "Meus favoritos", description: "Produtos que você amou" },
];

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={`size-3 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
      fill="none"
      viewBox="0 0 12 12"
    >
      <path d="m2.5 4.5 3.5 3 3.5-3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </svg>
  );
}

export function AccountMenuClient({ user, initials, firstName }: AccountMenuClientProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // O header persiste entre rotas no App Router. Fechar explicitamente evita
  // que o popover continue aberto depois que a nova página for renderizada.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function closeMenu() {
    setOpen(false);
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        aria-controls="account-menu-popover"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`Conta de ${user.name}`}
        className="focus-ring flex cursor-pointer items-center gap-2 rounded-full p-1 transition-colors hover:bg-black/5"
        onClick={() => setOpen((current) => !current)}
        ref={triggerRef}
        type="button"
      >
        <span className="grid size-9 place-items-center rounded-full bg-domary-yellow text-xs font-black text-domary-black">{initials}</span>
        <span className="hidden max-w-24 truncate text-left text-xs font-bold xl:block">Olá, {firstName}</span>
        <span className="hidden xl:block"><ChevronIcon open={open} /></span>
      </button>

      {open ? (
        <div
          className="account-menu-popover fixed inset-x-4 top-[8.75rem] z-50 max-h-[calc(100dvh-9.75rem)] w-auto overflow-y-auto overflow-x-hidden rounded-3xl border border-black/10 bg-white text-black shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-[calc(100%+0.75rem)] sm:max-h-[calc(100dvh-6rem)] sm:w-[min(22rem,calc(100vw-2rem))]"
          id="account-menu-popover"
        >
          <div className="border-b border-black/8 bg-domary-black px-5 py-5 text-white">
            <div className="flex items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-domary-yellow text-sm font-black text-domary-black">{initials}</span>
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold">{user.name}</p>
                <p className="truncate text-xs text-white/55">{user.email}</p>
                <p className="mt-1 text-[10px] font-black tracking-wider text-domary-yellow uppercase">Sessão ativa</p>
              </div>
            </div>
          </div>

          <nav className="p-2" aria-label="Menu da conta">
            {accountLinks.map((item) => (
              <Link
                className="focus-ring block rounded-2xl px-4 py-3 transition-colors hover:bg-black/[0.04]"
                href={item.href}
                key={item.href}
                onClick={closeMenu}
              >
                <span className="block text-sm font-extrabold">{item.label}</span>
                <span className="mt-0.5 block text-xs text-black/45">{item.description}</span>
              </Link>
            ))}
            {user.role === "ADMIN" ? (
              <Link
                className="focus-ring block rounded-2xl px-4 py-3 transition-colors hover:bg-domary-yellow/15"
                href="/admin"
                onClick={closeMenu}
              >
                <span className="block text-sm font-extrabold">Painel administrativo</span>
                <span className="mt-0.5 block text-xs text-black/45">Produtos, estoque e pedidos</span>
              </Link>
            ) : null}
          </nav>

          <LogoutForm />
        </div>
      ) : null}
    </div>
  );
}
