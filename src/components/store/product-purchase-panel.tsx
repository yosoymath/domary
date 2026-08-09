"use client";

import { useMemo, useRef, useState } from "react";
import { useToast } from "@/components/ui/toast";
import { RequiredMark } from "@/components/ui/required-mark";
import { readCart, writeCart } from "@/lib/cart";
import { formatPostalCode } from "@/lib/masks";

type ProductVariantOption = {
  id: string;
  size: string | null;
  color: string | null;
  colorHex: string | null;
  stockQuantity: number;
};

type ProductPurchasePanelProps = {
  initialPostalCode?: string;
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

export function ProductPurchasePanel({ initialPostalCode, product, variants }: ProductPurchasePanelProps) {
  const { showToast } = useToast();
  const sizeGuideRef = useRef<HTMLDialogElement>(null);
  const firstAvailable = variants.find((variant) => variant.stockQuantity > 0);
  const [selectedColorKey, setSelectedColorKey] = useState(() => firstAvailable ? colorKey(firstAvailable) : variants[0] ? colorKey(variants[0]) : "__sem-cor__");
  const [selectedId, setSelectedId] = useState(firstAvailable?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [cep, setCep] = useState(() => formatPostalCode(initialPostalCode ?? ""));
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
  }

  function selectColor(key: string) {
    const firstVariantForColor = variants.find((variant) => colorKey(variant) === key && variant.stockQuantity > 0);
    if (!firstVariantForColor) return;

    setSelectedColorKey(key);
    selectVariant(firstVariantForColor.id);
  }

  function addToCart() {
    if (!selectedVariant || selectedVariant.stockQuantity <= 0) {
      showToast({ message: "Selecione uma opção disponível.", variant: "error" });
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
    showToast(nextQuantity === currentQuantity
      ? { message: "Todo o estoque disponível já está no carrinho.", variant: "warning" }
      : { message: "Produto adicionado ao carrinho.", variant: "success" });
  }

  function calculateShipping(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const digits = cep.replace(/\D/g, "");
    showToast(digits.length === 8
      ? { title: "Frete calculado", message: "Frete grátis na simulação · entrega estimada em 4 a 8 dias úteis.", variant: "success" }
      : { message: "Informe um CEP com 8 números.", variant: "error" });
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
          <button
            className="focus-ring shrink-0 text-xs font-bold underline decoration-domary-yellow decoration-2 underline-offset-4 hover:text-black/60"
            onClick={() => sizeGuideRef.current?.showModal()}
            type="button"
          >
            Guia de medidas
          </button>
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
        {selectedVariant && selectedVariant.stockQuantity > 0 && selectedVariant.stockQuantity < 5 ? (
          <p aria-live="polite" className="mt-3 flex items-center gap-2 text-xs font-bold text-red-600">
            <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-red-600" />
            Últimas unidades: restam apenas {selectedVariant.stockQuantity} {selectedVariant.stockQuantity === 1 ? "peça" : "peças"} neste tamanho.
          </p>
        ) : null}
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
      <form className="mt-5 border-t border-black/10 pt-5" onSubmit={calculateShipping}>
        <div className="flex items-center justify-between gap-3"><label className="text-sm font-normal" htmlFor="shipping-cep">Calcular frete</label><span className="text-[10px] font-semibold tracking-wide text-emerald-700 uppercase">Simulação</span></div>
        <div className="mt-3 flex gap-2">
          <input
            autoComplete="postal-code"
            className="focus-ring min-h-12 min-w-0 flex-1 rounded-xl border border-black/15 bg-white px-4 text-sm"
            id="shipping-cep"
            inputMode="numeric"
            maxLength={9}
            name="postalCode"
            onChange={(event) => setCep(formatPostalCode(event.target.value))}
            placeholder="00000-000"
            value={cep}
          />
          <button className="focus-ring rounded-xl border border-black px-4 text-xs font-semibold" type="submit">Calcular</button>
        </div>
      </form>

      <div className="mt-4 divide-y divide-black/10 border-y border-black/10">
        <details className="group py-4"><summary className="focus-ring flex cursor-pointer list-none items-center justify-between text-sm font-semibold">Entrega e devoluções <span className="text-xl font-light group-open:rotate-45">+</span></summary><p className="pt-3 text-xs leading-5 text-black/55">Envio para todo o Brasil e troca facilitada em até 30 dias após o recebimento.</p></details>
        <details className="group py-4"><summary className="focus-ring flex cursor-pointer list-none items-center justify-between text-sm font-semibold">Cuidados com a peça <span className="text-xl font-light group-open:rotate-45">+</span></summary><p className="pt-3 text-xs leading-5 text-black/55">Siga as instruções da etiqueta para preservar cores, tecido e acabamento por mais tempo.</p></details>
      </div>

      <dialog
        aria-labelledby="size-guide-title"
        className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-2xl overflow-hidden rounded-[1.75rem] bg-white p-0 text-black shadow-2xl backdrop:bg-black/65 backdrop:backdrop-blur-sm"
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
        ref={sizeGuideRef}
      >
        <div className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
          <div className="sticky top-0 z-10 flex items-start justify-between gap-5 border-b border-black/10 bg-white px-5 py-5 sm:px-7">
            <div>
              <p className="text-[10px] font-bold tracking-[0.2em] text-black/40 uppercase">Encontre o tamanho ideal</p>
              <h2 className="mt-1 text-2xl font-black tracking-[-0.04em] uppercase" id="size-guide-title">Guia de medidas</h2>
            </div>
            <button
              aria-label="Fechar guia de medidas"
              autoFocus
              className="focus-ring grid size-10 shrink-0 place-items-center rounded-full bg-black/[0.055] text-xl leading-none hover:bg-domary-yellow"
              onClick={() => sizeGuideRef.current?.close()}
              type="button"
            >
              ×
            </button>
          </div>

          <div className="px-5 py-6 sm:px-7">
            <p className="text-sm leading-6 text-black/60">
              Meça o corpo mantendo a fita paralela ao chão, sem apertar. Compare as medidas em centímetros com a tabela abaixo.
            </p>

            <div className="mt-5 overflow-x-auto rounded-2xl border border-black/10">
              <table className="w-full min-w-[500px] border-collapse text-left text-sm">
                <thead className="bg-domary-black text-white">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Tamanho</th>
                    <th className="px-4 py-3 font-semibold">Tórax</th>
                    <th className="px-4 py-3 font-semibold">Cintura</th>
                    <th className="px-4 py-3 font-semibold">Quadril</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/8">
                  {[
                    ["PP", "84–88", "70–74", "86–90"],
                    ["P", "89–96", "75–82", "91–98"],
                    ["M", "97–104", "83–90", "99–106"],
                    ["G", "105–112", "91–98", "107–114"],
                    ["GG", "113–120", "99–106", "115–122"],
                    ["XGG", "121–128", "107–114", "123–130"],
                  ].map(([size, chest, waist, hip]) => (
                    <tr className="odd:bg-black/[0.018]" key={size}>
                      <th className="px-4 py-3.5 font-black">{size}</th>
                      <td className="px-4 py-3.5 text-black/65">{chest} cm</td>
                      <td className="px-4 py-3.5 text-black/65">{waist} cm</td>
                      <td className="px-4 py-3.5 text-black/65">{hip} cm</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                ["01", "Tórax", "Contorne a parte mais larga do peito."],
                ["02", "Cintura", "Meça a região mais estreita do tronco."],
                ["03", "Quadril", "Contorne a parte mais larga do quadril."],
              ].map(([number, title, description]) => (
                <div className="rounded-2xl bg-black/[0.035] p-4" key={number}>
                  <span className="text-xs font-black text-domary-yellow">{number}</span>
                  <h3 className="mt-2 text-sm font-bold">{title}</h3>
                  <p className="mt-1 text-xs leading-5 text-black/50">{description}</p>
                </div>
              ))}
            </div>

            <p className="mt-5 text-xs leading-5 text-black/45">
              As medidas são orientativas e podem variar conforme a modelagem e a marca. Em caso de dúvida entre dois tamanhos, prefira o maior.
            </p>
          </div>
        </div>
      </dialog>
    </div>
  );
}
