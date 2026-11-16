"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/ui/toast";
import { type CartItem, readCart, writeCart } from "@/lib/cart";

function currency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function CartPageClient() {
  const { showToast } = useToast();
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const checkoutRequestId = useRef<string | null>(null);

  useEffect(() => {
    setItems(readCart());
    setReady(true);
  }, []);

  function replaceItems(nextItems: CartItem[]) {
    setItems(nextItems);
    writeCart(nextItems);
    checkoutRequestId.current = null;
  }

  function changeQuantity(variantId: string, change: number) {
    replaceItems(items.map((item) => item.variantId === variantId ? { ...item, quantity: Math.min(item.stockQuantity, Math.max(1, item.quantity + change)) } : item));
  }

  function removeItem(variantId: string) {
    replaceItems(items.filter((item) => item.variantId !== variantId));
  }

  const subtotal = items.reduce((total, item) => total + item.unitPrice * item.quantity, 0);

  async function startCheckout() {
    if (checkingOut) return;
    setCheckingOut(true);
    checkoutRequestId.current ??= crypto.randomUUID();

    try {
      const response = await fetch("/api/checkout/pagbank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkoutRequestId: checkoutRequestId.current,
          items: items.map((item) => ({ variantId: item.variantId, quantity: item.quantity })),
        }),
      });
      const data = await response.json() as { checkoutUrl?: string; error?: string; code?: string };

      if (response.status === 401) {
        window.location.assign(`/login?callbackUrl=${encodeURIComponent("/carrinho")}`);
        return;
      }
      if (!response.ok || !data.checkoutUrl) {
        if (data.code === "RESTART_CHECKOUT") checkoutRequestId.current = null;
        showToast({ message: data.error ?? "Não foi possível iniciar o pagamento.", variant: "error" });
        return;
      }

      window.location.assign(data.checkoutUrl);
    } catch {
      showToast({ message: "Não foi possível conectar ao pagamento. Verifique sua internet e tente novamente.", variant: "error" });
    } finally {
      setCheckingOut(false);
    }
  }

  if (!ready) return <div className="min-h-60 animate-pulse rounded-3xl bg-black/5" />;

  if (!items.length) {
    return (
      <div className="rounded-[2rem] border border-dashed border-black/15 bg-white px-5 py-16 text-center">
        <h2 className="text-xl font-semibold">Seu carrinho está vazio</h2>
        <p className="mt-2 text-sm text-black/50">Explore a vitrine e escolha as peças que combinam com você.</p>
        <Link className="btn btn-primary focus-ring mt-7" href="/produtos">Explorar produtos</Link>
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

      <aside className="h-fit rounded-[10px] border border-white/10 bg-[#0d0d0c] p-6 text-white lg:sticky lg:top-32">
        <h2 className="text-lg font-semibold">Resumo</h2>
        <fieldset className="mt-6">
          <legend className="text-xs font-black tracking-wider text-white/55 uppercase">Como você quer receber?</legend>
          <label className="mt-3 flex cursor-default items-start gap-3 rounded-2xl border border-domary-yellow bg-white/[0.06] p-4">
            <input checked className="mt-0.5 size-4 accent-domary-yellow" name="fulfillmentMethod" readOnly type="radio" value="STORE_PICKUP" />
            <span><strong className="block text-sm text-white">Retirada na loja</strong><span className="mt-1 block text-xs leading-5 text-white/55">Sem custo · aguarde a confirmação antes de retirar</span></span>
          </label>
          <label aria-disabled="true" className="mt-2 flex cursor-not-allowed items-start gap-3 rounded-2xl border border-white/10 p-4 opacity-45">
            <input className="mt-0.5 size-4" disabled name="fulfillmentMethod" type="radio" value="DELIVERY" />
            <span><strong className="block text-sm text-white">Entrega</strong><span className="mt-1 block text-xs leading-5 text-white/55">Temporariamente indisponível</span></span>
          </label>
        </fieldset>
        <div className="mt-6 space-y-3 text-sm"><div className="flex justify-between gap-4 text-white/65"><span>Subtotal</span><span>{currency(subtotal)}</span></div><div className="flex justify-between gap-4 text-white/65"><span>Retirada</span><span>Sem custo</span></div></div>
        <div className="mt-5 flex justify-between gap-4 border-t border-white/15 pt-5 text-lg font-black"><span>Total</span><span>{currency(subtotal)}</span></div>
        <div className="mt-5 rounded-2xl border border-domary-yellow/45 bg-domary-yellow/10 p-4">
          <p className="text-xs font-black text-domary-yellow uppercase">Importante</p>
          <p className="mt-1.5 text-xs leading-5 text-white/70">No momento, pedidos feitos pelo site estão disponíveis somente para retirada na loja.</p>
        </div>
        <button className="btn btn-primary focus-ring mt-6 w-full disabled:cursor-wait disabled:opacity-60" disabled={checkingOut} onClick={startCheckout} type="button">{checkingOut ? "Preparando pagamento..." : "Ir para o pagamento"}</button>
        <p className="mt-4 text-[11px] leading-5 text-white/45">Pagamento seguro no PagBank · Preços e estoque conferidos ao finalizar</p>
      </aside>
    </div>
  );
}
