import Link from "next/link";

const supportLinks = [
  { href: "/contato", label: "Fale conosco" },
  { href: "/trocas", label: "Trocas e devoluções" },
  { href: "/privacidade", label: "Privacidade" },
] as const;

type SupportPageShellProps = {
  activePath: (typeof supportLinks)[number]["href"];
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
};

export function SupportPageShell({ activePath, eyebrow, title, description, children }: SupportPageShellProps) {
  return (
    <div className="bg-domary-cream">
      <section className="border-b border-black/8 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="relative mx-auto max-w-7xl">
          <nav aria-label="Navegação estrutural" className="flex items-center gap-2 text-xs text-black/45">
            <Link className="focus-ring hover:text-black" href="/">Início</Link>
            <span aria-hidden="true">/</span>
            <span className="text-black/70">Atendimento</span>
          </nav>
          <p className="eyebrow mt-8">{eyebrow}</p>
          <h1 className="display mt-3 max-w-3xl text-4xl sm:text-5xl">{title}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-black/55 sm:text-base">{description}</p>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-10 lg:px-8">
        <aside className="self-start rounded-[1.75rem] border border-black/8 bg-white p-3 lg:sticky lg:top-28">
          <p className="px-4 pb-3 pt-2 text-[11px] font-black tracking-[0.16em] text-black/40 uppercase">Central de ajuda</p>
          <nav aria-label="Tópicos de atendimento" className="space-y-1">
            {supportLinks.map((item) => {
              const active = item.href === activePath;
              return (
                <Link
                  aria-current={active ? "page" : undefined}
                  className={`focus-ring flex min-h-12 items-center justify-between rounded-2xl px-4 text-sm font-bold ${active ? "bg-domary-yellow text-domary-black" : "text-black/55 hover:bg-black/[0.04] hover:text-black"}`}
                  href={item.href}
                  key={item.href}
                >
                  {item.label}<span aria-hidden="true">→</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <article className="min-w-0 rounded-[2rem] border border-black/8 bg-white p-5 sm:p-8 lg:p-10">
          {children}
        </article>
      </div>
    </div>
  );
}

export function SupportSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-black/8 py-8 first:pt-0 last:border-0 last:pb-0">
      <h2 className="text-2xl font-black tracking-[-0.035em] sm:text-3xl">{title}</h2>
      <div className="mt-4 space-y-4 text-sm leading-7 text-black/60">{children}</div>
    </section>
  );
}
