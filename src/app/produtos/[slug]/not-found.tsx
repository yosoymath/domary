import Link from "next/link";

export default function ProductNotFound() {
  return (
    <section className="grid min-h-[65vh] place-items-center px-4 py-20 text-center">
      <div><span aria-hidden="true" className="text-7xl font-black text-domary-yellow">404.</span><h1 className="mt-5 text-3xl font-black">Produto não encontrado</h1><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-black/55">Este produto pode ter sido removido, arquivado ou ainda não está disponível na vitrine.</p><Link className="focus-ring mt-7 inline-flex min-h-12 items-center rounded-full bg-domary-black px-7 text-sm font-black text-white" href="/#produtos">Voltar aos produtos</Link></div>
    </section>
  );
}
