import type { Metadata } from "next";
import { CartPageClient } from "@/components/store/cart-page-client";

export const metadata: Metadata = {
  title: "Carrinho",
  description: "Revise os produtos selecionados no seu carrinho Domary.",
};

export default function CartPage() {
  return (
    <section className="mx-auto min-h-[65vh] max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="flex flex-col justify-between gap-4 border-b border-black/10 pb-8 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow text-black/55">Sua seleção</p>
          <h1 className="display mt-2 text-4xl sm:text-5xl">Carrinho</h1>
        </div>
        <ol aria-label="Etapas da compra" className="flex items-center gap-3 text-xs text-black/40">
          <li aria-current="step" className="font-semibold text-black">1. Carrinho</li>
          <li>2. Pagamento</li>
          <li>3. Retirada</li>
        </ol>
      </div>
      <div className="mt-8"><CartPageClient /></div>
    </section>
  );
}
