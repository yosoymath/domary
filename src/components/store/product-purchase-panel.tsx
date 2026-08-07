"use client";

import { useMemo, useState } from "react";
import { RequiredMark } from "@/components/ui/required-mark";
import { readCart, writeCart } from "@/lib/cart";

type ProductVariantOption = {
  id: string;
  size: string | null;
  color: string | null;
  colorHex: string | null;
  stockQuantity: number;
};

type ProductPurchasePanelProps = {
  product: {
    id: string;
    slug: string;
    name: string;
    imageUrl?: string;
    unitPrice: number;
  };
  variants: ProductVariantOption[];
};

function variantLabel(variant: ProductVariantOption) {
  return [variant.size ?? "Tamanho único", variant.color].filter(Boolean).join(" · ");
}

function colorKey(variant: ProductVariantOption) {
  return variant.color?.trim().toLocaleLowerCase("pt-BR") || "__sem-cor__";
}

export function ProductPurchasePanel({ product, variants }: ProductPurchasePanelProps) {
  const firstAvailable = variants.find((variant) => variant.stockQuantity > 0);
  const [selectedColorKey, setSelectedColorKey] = useState(() => firstAvailable ? colorKey(firstAvailable) : variants[0] ? colorKey(variants[0]) : "__sem-cor__");
  const [selectedId, setSelectedId] = useState(firstAvailable?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState<string>();
  const [cep, setCep] = useState("");
  const [shippingMessage, setShippingMessage] = useState<string>();
  const selectedVariant = useMemo(() => variants.find((variant) => variant.id === selectedId), [selectedId, variants]);
  const colors = useMemo(() => {
    const uniqueColors = new Map<string, { key: string; name: string | null; hex: string | null; available: boolean }>();

    variants.forEach((variant) => {
      const key = colorKey(variant);
      const current = uniqueColors.get(key);
      uniqueColors.set(key, {
        key,
        name: variant.color,
        hex: variant.colorHex,
        available: Boolean(current?.available || variant.stockQuantity > 0),
      });
    });

    return [...uniqueColors.values()];
  }, [variants]);
  const variantsForSelectedColor = useMemo(() => variants.filter((variant) => colorKey(variant) === selectedColorKey), [selectedColorKey, variants]);
  const totalStock = variants.reduce((total, variant) => total + variant.stockQuantity, 0);

  function selectVariant(id: string) {
    setSelectedId(id);
    setQuantity(1);
    setMessage(undefined);
  }

  function selectColor(key: string) {
    const firstVariantForColor = variants.find((variant) => colorKey(variant) === key && variant.stockQuantity > 0);
    if (!firstVariantForColor) return;

    setSelectedColorKey(key);
    selectVariant(firstVariantForColor.id);
  }

  function addToCart() {
    if (!selectedVariant || selectedVariant.stockQuantity <= 0) {
      setMessage("Selecione uma opção disponível.");
      return;
    }

    const cart = readCart();
    const itemIndex = cart.findIndex((item) => item.variantId === selectedVariant.id);
    const currentQuantity = itemIndex >= 0 ? cart[itemIndex].quantity : 0;
    const nextQuantity = Math.min(currentQuantity + quantity, selectedVariant.stockQuantity);

    if (itemIndex >= 0) {
      cart[itemIndex] = { ...cart[itemIndex], quantity: nextQuantity, stockQuantity: selectedVariant.stockQuantity };
    } else {
      cart.push({
        productId: product.id,
        productSlug: product.slug,
        variantId: selectedVariant.id,
        name: product.name,
        variantLabel: variantLabel(selectedVariant),
        imageUrl: product.imageUrl,
        unitPrice: product.unitPrice,
        quantity: nextQuantity,
        stockQuantity: selectedVariant.stockQuantity,
      });
    }

    writeCart(cart);
    setMessage(nextQuantity === currentQuantity ? "Todo o estoque disponível já está no carrinho." : "Produto adicionado ao carrinho.");
  }

  function calculateShipping(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const digits = cep.replace(/\D/g, "");
    setShippingMessage(digits.length === 8 ? "Frete grátis na simulação · entrega estimada em 4 a 8 dias úteis." : "Informe um CEP com 8 números.");
  }

  return (
    <div className="mt-7">
      {colors.some((color) => color.name) ? (
        <div>
          <div>
            <p className="text-sm font-normal">Cor<RequiredMark /></p>
            <p className="mt-1 text-xs text-black/45">Escolha uma das cores disponíveis.</p>
          </div>

          <div aria-label="Escolha a cor" className="mt-3 flex flex-wrap gap-3" role="radiogroup">
            {colors.filter((color) => color.name).map((color) => {
              const selected = selectedColorKey === color.key;
              return (
                <button
                  aria-checked={selected}
                  aria-label={`Selecionar cor ${color.name}`}
                  className={`focus-ring relative grid size-10 place-items-center rounded-full border bg-white p-1.5 ${selected ? "border-black ring-2 ring-black ring-offset-2" : "border-black/15 hover:scale-105 hover:border-black/35"} disabled:cursor-not-allowed disabled:opacity-30`}
                  disabled={!color.available}
                  key={color.key}
                  onClick={() => selectColor(color.key)}
                  role="radio"
                  title={color.name ?? "Cor padrão"}
                  type="button"
                >
                  <span className="size-full rounded-full border border-black/10" style={{ backgroundColor: color.hex ?? "#e5e5e5" }} />
                  {!color.available ? <span aria-hidden="true" className="absolute left-1/2 top-1/2 h-px w-8 -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-black/50" /> : null}
                  <span className="sr-only">{color.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className={colors.some((color) => color.name) ? "mt-6" : ""}>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-normal">Tamanho<RequiredMark /></p>
            <p className="mt-1 text-xs text-black/45">Selecione o tamanho desejado.</p>
          </div>
          <button className="focus-ring shrink-0 text-xs font-bold underline underline-offset-4" type="button">Guia de medidas</button>
        </div>

        <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5 lg:grid-cols-4 xl:grid-cols-5">
          {variantsForSelectedColor.map((variant) => {
            const unavailable = variant.stockQuantity <= 0;
            const selected = selectedId === variant.id;
            return (
              <button
                aria-pressed={selected}
                className={`focus-ring relative min-h-11 rounded-xl border px-2 text-xs font-semibold transition-colors ${selected ? "border-domary-black bg-domary-black text-white" : "border-black/15 bg-white hover:border-black"} disabled:cursor-not-allowed disabled:bg-black/[0.035] disabled:text-black/25`}
                disabled={unavailable}
                key={variant.id}
                onClick={() => selectVariant(variant.id)}
                type="button"
              >
                {variant.size ?? "Único"}
                {unavailable ? <span aria-hidden="true" className="absolute inset-x-2 top-1/2 h-px -rotate-12 bg-black/20" /> : null}
              </button>
            );
          })}
        </div>
      </div>

      {selectedVariant && selectedVariant.stockQuantity > 0 ? (
        <div className="mt-5 flex items-center justify-between rounded-2xl bg-black/[0.035] p-3">
          <span className="text-xs font-normal text-black/55">Quantidade</span>
          <div className="flex items-center gap-1">
            <button aria-label="Diminuir quantidade" className="focus-ring grid size-9 place-items-center rounded-full bg-white font-semibold" disabled={quantity <= 1} onClick={() => setQuantity((current) => Math.max(1, current - 1))} type="button">−</button>
            <span className="w-8 text-center text-sm font-semibold">{quantity}</span>
            <button aria-label="Aumentar quantidade" className="focus-ring grid size-9 place-items-center rounded-full bg-white font-semibold" disabled={quantity >= selectedVariant.stockQuantity} onClick={() => setQuantity((current) => Math.min(selectedVariant.stockQuantity, current + 1))} type="button">+</button>
          </div>
        </div>
      ) : null}

      <button className="focus-ring mt-4 min-h-14 w-full rounded-full bg-domary-yellow px-6 text-sm font-semibold text-domary-black transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-black/10 disabled:text-black/35" disabled={!totalStock} onClick={addToCart} type="button">
        {totalStock ? "Adicionar ao carrinho" : "Produto esgotado"}
      </button>
      <p aria-live="polite" className={`mt-3 min-h-5 text-center text-xs font-bold ${message?.includes("adicionado") ? "text-emerald-700" : "text-red-600"}`}>{message}</p>

      <form className="mt-5 border-t border-black/10 pt-5" onSubmit={calculateShipping}>
        <div className="flex items-center justify-between gap-3"><label className="text-sm font-normal" htmlFor="shipping-cep">Calcular frete</label><span className="text-[10px] font-semibold tracking-wide text-emerald-700 uppercase">Simulação</span></div>
        <div className="mt-3 flex gap-2">
          <input className="focus-ring min-h-12 min-w-0 flex-1 rounded-xl border border-black/15 bg-white px-4 text-sm" id="shipping-cep" inputMode="numeric" maxLength={9} onChange={(event) => setCep(event.target.value)} placeholder="00000-000" value={cep} />
          <button className="focus-ring rounded-xl border border-black px-4 text-xs font-semibold" type="submit">Calcular</button>
        </div>
        <p aria-live="polite" className="mt-2 min-h-5 text-xs font-semibold text-black/55">{shippingMessage}</p>
      </form>

      <div className="mt-4 divide-y divide-black/10 border-y border-black/10">
        <details className="group py-4"><summary className="focus-ring flex cursor-pointer list-none items-center justify-between text-sm font-semibold">Entrega e devoluções <span className="text-xl font-light group-open:rotate-45">+</span></summary><p className="pt-3 text-xs leading-5 text-black/55">Envio para todo o Brasil e troca facilitada em até 30 dias após o recebimento.</p></details>
        <details className="group py-4"><summary className="focus-ring flex cursor-pointer list-none items-center justify-between text-sm font-semibold">Cuidados com a peça <span className="text-xl font-light group-open:rotate-45">+</span></summary><p className="pt-3 text-xs leading-5 text-black/55">Siga as instruções da etiqueta para preservar cores, tecido e acabamento por mais tempo.</p></details>
      </div>
    </div>
  );
}
