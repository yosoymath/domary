import Link from "next/link";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
};

export function AuthShell({ eyebrow, title, description, children }: AuthShellProps) {
  return (
    <section className="px-4 py-10 text-black sm:px-6 sm:py-16 lg:px-8">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[10px] border border-black/8 bg-white lg:min-h-[600px] lg:grid-cols-2">
        <aside className="hidden flex-col justify-between bg-[#111111] p-12 text-white lg:flex">
          <Link className="focus-ring w-fit text-xl font-bold tracking-[-0.03em]" href="/">
            Domary<span className="text-domary-yellow">.</span>
          </Link>

          <div>
            <p className="display text-5xl">
              Seu estilo.<br />
              <span className="text-domary-yellow">Seu espaço.</span>
            </p>
            <ul className="mt-8 space-y-2.5 text-sm text-white/60">
              {["Acompanhe pedidos e retiradas", "Salve suas peças favoritas", "Compre mais rápido"].map((item) => (
                <li className="flex items-center gap-2.5" key={item}>
                  <span aria-hidden="true" className="size-1.5 rounded-full bg-domary-yellow" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <div className="flex items-center justify-center p-6 sm:p-10 lg:p-14">
          <div className="w-full max-w-sm">
            <p className="eyebrow">{eyebrow}</p>
            <h1 className="display mt-3 text-3xl sm:text-4xl">{title}</h1>
            <p className="mt-3 text-sm leading-6 text-black/55">{description}</p>
            <div className="mt-8">{children}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
