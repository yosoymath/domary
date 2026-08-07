import Link from "next/link";

export function AdminPageHeader({ eyebrow, title, description, actionHref, actionLabel }: {
  eyebrow: string;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div>
        <p className="text-[11px] font-black tracking-[0.2em] text-black/35 uppercase">{eyebrow}</p>
        <h1 className="mt-2 [overflow-wrap:anywhere] text-3xl font-black tracking-[-0.04em] text-black sm:text-4xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-black/50">{description}</p>
      </div>
      {actionHref && actionLabel ? (
        <Link className="focus-ring inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-domary-yellow px-6 text-sm font-black text-domary-black transition hover:bg-domary-yellow-light" href={actionHref}>
          + {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
