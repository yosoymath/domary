import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-domary-black text-white" data-site-footer>
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div>
          <Link className="focus-ring text-3xl font-black tracking-[-0.08em] uppercase" href="/">
            Domary<span className="text-domary-yellow">.</span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-6 text-white/60">
            Moda para vestir sua atitude. Peças marcantes, qualidade e uma experiência simples do clique à entrega.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-semibold tracking-wide uppercase">Loja</h2>
          <div className="mt-4 flex flex-col gap-3 text-sm text-white/60">
            <Link href="/#produtos">Mais vendidos</Link>
            <Link href="/#categorias">Roupas</Link>
            <Link href="/#categorias">Acessórios</Link>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold tracking-wide uppercase">Atendimento</h2>
          <div className="mt-4 flex flex-col gap-3 text-sm text-white/60">
            <Link href="/contato">Fale conosco</Link>
            <Link href="/trocas">Trocas e devoluções</Link>
            <Link href="/privacidade">Privacidade</Link>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 px-4 py-5 text-center text-xs text-white/45">
        © {new Date().getFullYear()} Domary. Todos os direitos reservados.
      </div>
    </footer>
  );
}
