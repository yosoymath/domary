import Link from "next/link";

type EmptyStateProps = {
  symbol: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
};

export function EmptyState({ symbol, title, description, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <div className="rounded-[2rem] border border-dashed border-black/15 bg-white px-6 py-14 text-center">
      <span aria-hidden="true" className="mx-auto grid size-16 place-items-center rounded-full bg-domary-yellow text-2xl font-black">{symbol}</span>
      <h2 className="mt-5 text-xl font-black">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-black/50">{description}</p>
      {actionHref && actionLabel ? (
        <Link className="focus-ring mt-6 inline-flex rounded-full bg-domary-black px-6 py-3 text-sm font-black text-white transition hover:-translate-y-0.5" href={actionHref}>
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
