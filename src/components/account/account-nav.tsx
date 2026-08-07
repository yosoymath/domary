import Link from "next/link";

const links = [
  { href: "/account", label: "Visão geral", symbol: "⌂" },
  { href: "/account/profile", label: "Perfil", symbol: "◯" },
  { href: "/account/orders", label: "Minhas compras", symbol: "▣" },
  { href: "/account/favorites", label: "Meus favoritos", symbol: "♡" },
];

export function AccountNav() {
  return (
    <nav aria-label="Navegação da conta">
      <div className="grid grid-cols-2 gap-2 pb-2 lg:flex lg:flex-col lg:pb-0">
        {links.map((item) => (
          <Link className="focus-ring flex min-w-0 items-center gap-2 rounded-2xl border border-black/8 bg-white px-3 py-3 text-xs leading-tight font-extrabold transition hover:border-domary-yellow hover:bg-domary-yellow/10 sm:text-sm lg:gap-3 lg:border-transparent lg:bg-transparent lg:px-4" href={item.href} key={item.href}>
            <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-full bg-domary-yellow/20 text-sm lg:size-8 lg:text-base">{item.symbol}</span>
            <span className="min-w-0">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
