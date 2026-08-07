import Link from "next/link";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
};

export function AuthShell({ eyebrow, title, description, children }: AuthShellProps) {
  return (
    <section className="relative isolate overflow-hidden bg-[#0d0d0d] px-4 py-14 text-white sm:px-6 sm:py-20 lg:px-8">
      <div aria-hidden="true" className="absolute -left-28 top-20 size-72 rounded-full border-[44px] border-domary-yellow/10" />
      <div aria-hidden="true" className="absolute -right-32 bottom-0 size-96 rounded-full bg-domary-yellow/5 blur-3xl" />

      <div className="relative mx-auto grid min-h-[650px] max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#151515] shadow-2xl lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="relative hidden overflow-hidden bg-domary-yellow p-12 text-domary-black lg:flex lg:flex-col lg:justify-between">
          <Link className="focus-ring w-fit text-3xl font-black tracking-[-0.08em] uppercase" href="/">
            Domary<span className="text-white">.</span>
          </Link>

          <div className="relative z-10">
            <p className="text-xs font-black tracking-[0.2em] uppercase">Sua conta Domary</p>
            <p className="mt-4 max-w-sm text-5xl leading-[0.92] font-black tracking-[-0.06em] uppercase">
              Seu estilo.<br />Seu espaço.
            </p>
            <p className="mt-6 max-w-sm text-sm leading-6 text-black/65">
              Acompanhe pedidos, salve seus favoritos e tenha uma experiência feita para você.
            </p>
          </div>

          <div aria-hidden="true" className="absolute -bottom-28 -right-28 size-80 rounded-full border-[48px] border-black/10" />
        </aside>

        <div className="flex items-center justify-center p-6 sm:p-10 lg:p-16">
          <div className="w-full max-w-md">
            <p className="text-xs font-black tracking-[0.2em] text-domary-yellow uppercase">{eyebrow}</p>
            <h1 className="mt-3 text-4xl font-black tracking-[-0.05em] uppercase sm:text-5xl">{title}</h1>
            <p className="mt-4 text-sm leading-6 text-white/55">{description}</p>
            <div className="mt-8">{children}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
