"use client";

import { useRef, useState } from "react";
import { AdminFieldError } from "@/components/admin/form-elements";
import { RequiredMark } from "@/components/ui/required-mark";

export type ProductVariantFormValue = {
  size: string | null;
  color: string | null;
  colorHex: string | null;
  stockQuantity: number;
};

type SizeOption = {
  id: string;
  label: string;
  value: string | null;
};

type ColorOption = {
  id: string;
  name: string | null;
  hex: string | null;
};

type EditorState = {
  sizes: SizeOption[];
  colors: ColorOption[];
  stocks: Record<string, number>;
};

type ProductVariantEditorProps = {
  errors?: string[];
  initialVariants?: ProductVariantFormValue[];
};

const suggestedSizes = ["PP", "P", "M", "G", "GG", "XGG", "34", "36", "38", "40", "42", "44"];
const defaultVariants: ProductVariantFormValue[] = [
  { size: "P", color: "Preto", colorHex: "#111111", stockQuantity: 10 },
  { size: "M", color: "Preto", colorHex: "#111111", stockQuantity: 10 },
  { size: "G", color: "Preto", colorHex: "#111111", stockQuantity: 10 },
];

const compactInputClassName = "focus-ring min-h-11 rounded-xl border border-black/10 bg-white px-3 text-sm outline-none hover:border-black/20 focus:border-domary-yellow";

function normalized(value: string | null) {
  return value?.trim().toLocaleLowerCase("pt-BR") ?? "";
}

function stockKey(sizeId: string, colorId: string) {
  return `${sizeId}::${colorId}`;
}

function createInitialState(initialVariants?: ProductVariantFormValue[]): EditorState {
  const source = initialVariants?.length ? initialVariants : defaultVariants;
  const sizes: SizeOption[] = [];
  const colors: ColorOption[] = [];
  const stocks: Record<string, number> = {};

  for (const variant of source) {
    let size = sizes.find((item) => normalized(item.value) === normalized(variant.size));
    if (!size) {
      size = {
        id: `initial-size-${sizes.length}`,
        label: variant.size ?? "Único",
        value: variant.size,
      };
      sizes.push(size);
    }

    let color = colors.find((item) => normalized(item.name) === normalized(variant.color));
    if (!color) {
      color = {
        id: `initial-color-${colors.length}`,
        name: variant.color,
        hex: variant.colorHex,
      };
      colors.push(color);
    }

    stocks[stockKey(size.id, color.id)] = variant.stockQuantity;
  }

  return { sizes, colors, stocks };
}

function RemoveIcon() {
  return (
    <svg aria-hidden="true" className="size-3.5" fill="none" viewBox="0 0 16 16">
      <path d="m4 4 8 8m0-8-8 8" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 16 16">
      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
    </svg>
  );
}

export function ProductVariantEditor({ errors, initialVariants }: ProductVariantEditorProps) {
  const [editor, setEditor] = useState<EditorState>(() => createInitialState(initialVariants));
  const [customSize, setCustomSize] = useState("");
  const [colorName, setColorName] = useState("");
  const [colorHex, setColorHex] = useState("#111111");
  const [message, setMessage] = useState("");
  const idCounter = useRef(0);

  function nextId(prefix: string) {
    idCounter.current += 1;
    return `${prefix}-${idCounter.current}`;
  }

  function addSize(value: string | null) {
    const label = value?.trim() || "Único";
    const normalizedValue = value?.trim() || null;

    if (editor.sizes.some((size) => normalized(size.value) === normalized(normalizedValue))) {
      setMessage(`O tamanho ${label} já foi adicionado.`);
      return;
    }

    const size: SizeOption = { id: nextId("size"), label, value: normalizedValue };
    setEditor((current) => {
      const stocks = { ...current.stocks };
      current.colors.forEach((color) => { stocks[stockKey(size.id, color.id)] = 0; });
      return { ...current, sizes: [...current.sizes, size], stocks };
    });
    setCustomSize("");
    setMessage("");
  }

  function removeSize(sizeId: string) {
    if (editor.sizes.length === 1) {
      setMessage("O produto precisa ter ao menos um tamanho ou a opção Único.");
      return;
    }

    setEditor((current) => ({
      ...current,
      sizes: current.sizes.filter((size) => size.id !== sizeId),
      stocks: Object.fromEntries(Object.entries(current.stocks).filter(([key]) => !key.startsWith(`${sizeId}::`))),
    }));
    setMessage("");
  }

  function addColor(name: string | null, hex: string | null) {
    const trimmedName = name?.trim() || null;
    if (trimmedName && trimmedName.length < 2) {
      setMessage("Informe um nome de cor com pelo menos 2 caracteres.");
      return;
    }
    if (editor.colors.some((color) => normalized(color.name) === normalized(trimmedName))) {
      setMessage(trimmedName ? `A cor ${trimmedName} já foi adicionada.` : "A opção sem cor já foi adicionada.");
      return;
    }

    const color: ColorOption = { id: nextId("color"), name: trimmedName, hex: trimmedName ? hex?.toUpperCase() ?? "#111111" : null };
    setEditor((current) => {
      const stocks = { ...current.stocks };
      current.sizes.forEach((size) => { stocks[stockKey(size.id, color.id)] = 0; });
      return { ...current, colors: [...current.colors, color], stocks };
    });
    setColorName("");
    setMessage("");
  }

  function removeColor(colorId: string) {
    if (editor.colors.length === 1) {
      setMessage("O produto precisa ter ao menos uma cor ou a opção Sem cor.");
      return;
    }

    setEditor((current) => ({
      ...current,
      colors: current.colors.filter((color) => color.id !== colorId),
      stocks: Object.fromEntries(Object.entries(current.stocks).filter(([key]) => !key.endsWith(`::${colorId}`))),
    }));
    setMessage("");
  }

  function changeColorHex(colorId: string, hex: string) {
    setEditor((current) => ({
      ...current,
      colors: current.colors.map((color) => color.id === colorId ? { ...color, hex: hex.toUpperCase() } : color),
    }));
  }

  function changeStock(sizeId: string, colorId: string, value: string) {
    const quantity = Math.min(1_000_000, Math.max(0, Number.parseInt(value || "0", 10) || 0));
    setEditor((current) => ({ ...current, stocks: { ...current.stocks, [stockKey(sizeId, colorId)]: quantity } }));
  }

  const variants = editor.sizes.flatMap((size) => editor.colors.map((color) => ({
    size: size.value,
    color: color.name,
    colorHex: color.hex,
    stockQuantity: editor.stocks[stockKey(size.id, color.id)] ?? 0,
  })));
  const totalStock = variants.reduce((total, variant) => total + variant.stockQuantity, 0);
  const uniqueSizeSelected = editor.sizes.some((size) => size.value === null);

  return (
    <div className="md:col-span-2">
      <input name="variants" type="hidden" value={JSON.stringify(variants)} />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-sm font-normal">Grade, cores e estoque<RequiredMark /></h3>
          <p className="mt-1 text-xs leading-5 text-black/45">Selecione os tamanhos e cadastre as cores. As combinações serão criadas automaticamente.</p>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="rounded-full bg-black/[0.045] px-3 py-1.5 font-semibold">{variants.length} {variants.length === 1 ? "variação" : "variações"}</span>
          <span className="rounded-full bg-domary-yellow/20 px-3 py-1.5 font-semibold">{totalStock} em estoque</span>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-black/8 bg-[#fafaf8] p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-domary-black text-xs font-bold text-white">1</span>
          <div>
            <h4 className="text-sm font-bold">Tamanhos disponíveis</h4>
            <p className="text-xs text-black/40">Use as sugestões ou adicione uma medida personalizada.</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            aria-pressed={uniqueSizeSelected}
            className={`focus-ring min-h-10 rounded-xl border px-3 text-xs font-normal ${
              uniqueSizeSelected
                ? "cursor-default border-domary-yellow bg-domary-yellow text-domary-black shadow-sm"
                : "border-dashed border-black/15 hover:border-domary-yellow hover:bg-domary-yellow/10"
            }`}
            disabled={uniqueSizeSelected}
            onClick={() => addSize(null)}
            type="button"
          >
            Único
          </button>
          {suggestedSizes.map((size) => {
            const selected = editor.sizes.some((item) => normalized(item.value) === normalized(size));
            return (
              <button
                aria-pressed={selected}
                className={`focus-ring min-h-10 min-w-11 rounded-xl border px-3 text-xs font-normal ${
                  selected
                    ? "cursor-default border-domary-yellow bg-domary-yellow text-domary-black shadow-sm"
                    : "border-black/10 bg-white hover:border-domary-yellow hover:bg-domary-yellow/10"
                }`}
                disabled={selected}
                key={size}
                onClick={() => addSize(size)}
                type="button"
              >
                {size}
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input aria-label="Tamanho personalizado" className={`${compactInputClassName} flex-1`} maxLength={20} onChange={(event) => setCustomSize(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); if (customSize.trim()) addSize(customSize); } }} placeholder="Outro tamanho, ex.: 46 ou 2XL" value={customSize} />
          <button className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-black/12 px-4 text-xs font-bold hover:border-domary-yellow hover:bg-domary-yellow/10 disabled:cursor-not-allowed disabled:opacity-40" disabled={!customSize.trim()} onClick={() => addSize(customSize)} type="button"><PlusIcon />Adicionar tamanho</button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {editor.sizes.map((size) => (
            <span className="inline-flex min-h-9 items-center gap-2 rounded-full bg-domary-black pl-3.5 pr-2 text-xs font-normal text-white" key={size.id}>
              {size.label}
              <button aria-label={`Remover tamanho ${size.label}`} className="focus-ring grid size-6 place-items-center rounded-full text-white/50 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-25" disabled={editor.sizes.length === 1} onClick={() => removeSize(size.id)} type="button"><RemoveIcon /></button>
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-black/8 bg-[#fafaf8] p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-domary-black text-xs font-bold text-white">2</span>
          <div>
            <h4 className="text-sm font-bold">Cores disponíveis</h4>
            <p className="text-xs text-black/40">Dê um nome à cor e selecione o tom que aparecerá na loja.</p>
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
          <input aria-label="Nome da cor" className={compactInputClassName} maxLength={40} onChange={(event) => setColorName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); if (colorName.trim()) addColor(colorName, colorHex); } }} placeholder="Ex.: Preto, Areia ou Azul marinho" value={colorName} />
          <label className="focus-ring flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-black/10 bg-white px-3 text-xs font-normal">
            <input aria-label="Selecionar tom da cor" className="size-7 cursor-pointer rounded border-0 bg-transparent p-0" onChange={(event) => setColorHex(event.target.value.toUpperCase())} type="color" value={colorHex} />
            <span className="font-mono text-[11px] text-black/50">{colorHex}</span>
          </label>
          <button className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-domary-yellow px-4 text-xs font-bold text-domary-black hover:bg-domary-yellow-light disabled:cursor-not-allowed disabled:opacity-40" disabled={!colorName.trim()} onClick={() => addColor(colorName, colorHex)} type="button"><PlusIcon />Adicionar cor</button>
        </div>

        {!editor.colors.some((color) => color.name === null) ? <button className="focus-ring mt-3 text-xs font-semibold text-black/45 underline decoration-black/20 underline-offset-4 hover:text-black" onClick={() => addColor(null, null)} type="button">Este produto não possui variação de cor</button> : null}

        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {editor.colors.map((color) => (
            <div className="flex min-w-0 items-center gap-3 rounded-xl border border-black/8 bg-white p-2.5" key={color.id}>
              {color.hex ? (
                <label className="relative grid size-9 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-lg border border-black/10" style={{ backgroundColor: color.hex }} title="Alterar tom">
                  <input aria-label={`Alterar tom de ${color.name}`} className="absolute inset-0 cursor-pointer opacity-0" onChange={(event) => changeColorHex(color.id, event.target.value)} type="color" value={color.hex} />
                </label>
              ) : <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-dashed border-black/15 bg-black/[0.025] text-[10px] text-black/35">—</span>}
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-normal">{color.name ?? "Sem cor"}</p>
                <p className="mt-0.5 font-mono text-[10px] text-black/35">{color.hex ?? "Não se aplica"}</p>
              </div>
              <button aria-label={`Remover cor ${color.name ?? "Sem cor"}`} className="focus-ring grid size-8 shrink-0 place-items-center rounded-lg text-black/30 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-20" disabled={editor.colors.length === 1} onClick={() => removeColor(color.id)} type="button"><RemoveIcon /></button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-black/8">
        <div className="flex items-center gap-3 border-b border-black/8 bg-[#fafaf8] px-4 py-4 sm:px-5">
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-domary-black text-xs font-bold text-white">3</span>
          <div>
            <h4 className="text-sm font-bold">Estoque por combinação</h4>
            <p className="text-xs text-black/40">Informe quantas unidades existem para cada variação.</p>
          </div>
        </div>

        <div className="hidden grid-cols-[minmax(100px,0.7fr)_minmax(160px,1fr)_140px] gap-4 border-b border-black/6 bg-black/[0.018] px-5 py-2.5 text-[10px] font-bold tracking-wide text-black/35 uppercase sm:grid">
          <span>Tamanho</span><span>Cor</span><span>Estoque</span>
        </div>
        <div className="divide-y divide-black/6">
          {editor.sizes.flatMap((size) => editor.colors.map((color) => (
            <div className="grid grid-cols-[minmax(0,1fr)_110px] items-center gap-3 px-4 py-3 sm:grid-cols-[minmax(100px,0.7fr)_minmax(160px,1fr)_140px] sm:gap-4 sm:px-5" key={stockKey(size.id, color.id)}>
              <span className="text-xs font-normal sm:text-sm">{size.label}</span>
              <span className="hidden min-w-0 items-center gap-2 text-xs sm:flex">
                <span className="size-5 shrink-0 rounded-full border border-black/10" style={{ backgroundColor: color.hex ?? "transparent" }} />
                <span className="truncate">{color.name ?? "Sem cor"}</span>
              </span>
              <label className="flex items-center rounded-xl border border-black/10 bg-white px-3 focus-within:border-domary-yellow">
                <input aria-label={`Estoque do tamanho ${size.label}, cor ${color.name ?? "sem cor"}`} className="min-h-10 min-w-0 w-full bg-transparent text-right text-sm font-normal outline-none" inputMode="numeric" max="1000000" min="0" onChange={(event) => changeStock(size.id, color.id, event.target.value)} type="number" value={editor.stocks[stockKey(size.id, color.id)] ?? 0} />
                <span className="ml-1 text-[10px] text-black/30">un.</span>
              </label>
              <span className="col-span-2 -mt-2 text-[10px] text-black/40 sm:hidden">{color.name ?? "Sem cor"}</span>
            </div>
          ))) }
        </div>
      </div>

      <p aria-live="polite" className={`mt-3 min-h-5 text-xs ${message ? "text-amber-700" : "text-black/40"}`}>{message || "As alterações na grade serão salvas junto com o produto."}</p>
      <AdminFieldError messages={errors} />
    </div>
  );
}
