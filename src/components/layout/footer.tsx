import Link from "next/link";

const columns = [
  {
    title: "Loja",
    links: [
      { href: "/produtos", label: "Todos os produtos" },
      { href: "/#categorias", label: "Categorias" },
      { href: "/#produtos", label: "Mais vendidos" },
    ],
  },
  {
    title: "Conta",
    links: [
      { href: "/account", label: "Minha conta" },
      { href: "/account/orders", label: "Pedidos" },
      { href: "/account/favorites", label: "Favoritos" },
    ],
  },
  {
    title: "Ajuda",
    links: [
      { href: "/contato", label: "Fale conosco" },
      { href: "/trocas", label: "Trocas e devoluções" },
      { href: "/privacidade", label: "Privacidade" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-black/8 bg-domary-cream" data-site-footer>
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 md:grid-cols-[1.2fr_2fr] lg:px-8">
        <div>
          <Link className="focus-ring text-xl font-bold tracking-[-0.03em]" href="/">
            Domary<span className="text-domary-yellow">.</span>
          </Link>
          <p className="mt-3 max-w-xs text-sm leading-6 text-black/55">Moda com personalidade. Compre online e retire na loja.</p>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {columns.map((column) => (
            <div key={column.title}>
              <p className="text-xs font-semibold text-black/40">{column.title}</p>
              <ul className="mt-4 space-y-2.5 text-sm">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link className="focus-ring text-black/70 hover:text-black" href={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl flex-col gap-1 border-t border-black/8 px-4 py-6 text-xs text-black/45 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
        <p>© {new Date().getFullYear()} Domary</p>
        <p>Pagamento seguro via PagBank</p>
      </div>
    </footer>
  );
}
