"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { type CartItem, readCart, writeCart } from "@/lib/cart";

function currency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function CartPageClient() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState<string>();

  useEffect(() => {
    setItems(readCart());
    setReady(true);
  }, []);

  function replaceItems(nextItems: CartItem[]) {
    setItems(nextItems);
    writeCart(nextItems);
    setMessage(undefined);
  }

  function changeQuantity(variantId: string, change: number) {
    replaceItems(items.map((item) => item.variantId === variantId ? { ...item, quantity: Math.min(item.stockQuantity, Math.max(1, item.quantity + change)) } : item));
  }

  function removeItem(variantId: string) {
    replaceItems(items.filter((item) => item.variantId !== variantId));
  }

  const subtotal = items.reduce((total, item) => total + item.unitPrice * item.quantity, 0);

  if (!ready) return <div className="min-h-60 animate-pulse rounded-3xl bg-black/5" />;

  if (!items.length) {
    return (
      <div className="rounded-[2rem] border border-dashed border-black/15 bg-white px-5 py-16 text-center">
        <span aria-hidden="true" className="text-6xl font-black text-domary-yellow">0.</span>
        <h2 className="mt-4 text-2xl font-black">Seu carrinho está vazio</h2>
        <p className="mt-2 text-sm text-black/50">Explore a vitrine e escolha as peças que combinam com você.</p>
        <Link className="focus-ring mt-7 inline-flex min-h-12 items-center rounded-full bg-domary-black px-7 text-sm font-black text-white" href="/#produtos">Explorar produtos</Link>
      </div>
    );
  }

  return (
    <div className="grid min-w-0 gap-7 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-3">
        {items.map((item) => (
          <article className="grid min-w-0 grid-cols-[6.5rem_minmax(0,1fr)] gap-4 rounded-2xl border border-black/8 bg-white p-3 sm:grid-cols-[9rem_minmax(0,1fr)] sm:p-4" key={item.variantId}>
            <Link className="focus-ring aspect-square overflow-hidden rounded-xl bg-[#f5f5f5]" href={`/produtos/${item.productSlug}`}>
              {item.imageUrl ? <img alt={`Foto de ${item.name}`} className="size-full object-cover" src={item.imageUrl} /> : <span className="grid size-full place-items-center text-4xl font-black text-domary-yellow">D.</span>}
            </Link>
            <div className="flex min-w-0 flex-col">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0"><Link className="focus-ring font-black hover:underline" href={`/produtos/${item.productSlug}`}>{item.name}</Link><p className="mt-1 text-xs text-black/45">{item.variantLabel}</p></div>
                <button aria-label={`Remover ${item.name}`} className="focus-ring shrink-0 text-xs font-black text-red-600 underline underline-offset-4" onClick={() => removeItem(item.variantId)} type="button">Remover</button>
              </div>
              <p className="mt-3 font-black">{currency(item.unitPrice)}</p>
              <div className="mt-auto flex items-center gap-1 pt-4">
                <button aria-label="Diminuir quantidade" className="focus-ring grid size-9 place-items-center rounded-full border border-black/10 font-black" disabled={item.quantity <= 1} onClick={() => changeQuantity(item.variantId, -1)} type="button">−</button>
                <span className="w-9 text-center text-sm font-black">{item.quantity}</span>
                <button aria-label="Aumentar quantidade" className="focus-ring grid size-9 place-items-center rounded-full border border-black/10 font-black" disabled={item.quantity >= item.stockQuantity} onClick={() => changeQuantity(item.variantId, 1)} type="button">+</button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <aside className="h-fit rounded-3xl bg-domary-black p-6 text-white lg:sticky lg:top-32">
        <h2 className="text-xl font-black">Resumo</h2>
        <div className="mt-6 space-y-3 text-sm"><div className="flex justify-between gap-4 text-white/65"><span>Subtotal</span><span>{currency(subtotal)}</span></div><div className="flex justify-between gap-4 text-white/65"><span>Frete</span><span>Calculado depois</span></div></div>
        <div className="mt-5 flex justify-between gap-4 border-t border-white/15 pt-5 text-lg font-black"><span>Total</span><span>{currency(subtotal)}</span></div>
        <button className="focus-ring mt-6 min-h-14 w-full rounded-full bg-domary-yellow px-5 text-sm font-black text-black" onClick={() => setMessage("Checkout simulado com sucesso. A integração de pagamento será feita na próxima etapa.")} type="button">Simular checkout</button>
        <p aria-live="polite" className="mt-3 min-h-5 text-xs font-bold leading-5 text-domary-yellow-light">{message}</p>
        <p className="mt-4 text-[11px] leading-5 text-white/45">Compra segura · Troca facilitada · Dados protegidos</p>
      </aside>
    </div>
  );
}
