import type { Metadata } from "next";
import { CartPageClient } from "@/components/store/cart-page-client";

export const metadata: Metadata = {
  title: "Carrinho",
  description: "Revise os produtos selecionados no seu carrinho Domary.",
};

export default function CartPage() {
  return (
    <section className="mx-auto min-h-[65vh] max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <p className="text-xs font-black tracking-[0.2em] text-black/45 uppercase">Sua seleção</p>
      <h1 className="mt-2 text-4xl font-black tracking-[-0.05em] sm:text-5xl">Carrinho</h1>
      <div className="mt-8"><CartPageClient /></div>
    </section>
  );
}
