"use client";

import { useRef, useState } from "react";
import { AdminFieldError, adminInputClassName } from "@/components/admin/form-elements";
import { useToast } from "@/components/ui/toast";

const MAX_IMAGES = 8;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type ProductImage = {
  id: string;
  url: string;
  label: string;
};

type UploadResponse = {
  url?: string;
  message?: string;
};

function existingImages(urls: string[]): ProductImage[] {
  return urls.map((url, index) => ({ id: `existing-${index}-${url}`, url, label: `Imagem ${index + 1}` }));
}

function newImageId() {
  return globalThis.crypto?.randomUUID?.() ?? `image-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function ProductImageManager({ initialImages, errors, onUploadingChange }: {
  initialImages: string[];
  errors?: string[];
  onUploadingChange: (uploading: boolean) => void;
}) {
  const { showToast } = useToast();
  const [images, setImages] = useState<ProductImage[]>(() => existingImages(initialImages));
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function setUploadState(value: boolean) {
    setUploading(value);
    onUploadingChange(value);
  }

  async function uploadFiles(fileList: FileList | File[]) {
    const remainingSlots = MAX_IMAGES - images.length;
    if (remainingSlots <= 0) {
      showToast({ message: `Você pode cadastrar no máximo ${MAX_IMAGES} imagens.`, variant: "warning" });
      return;
    }

    const selectedFiles = Array.from(fileList).slice(0, remainingSlots);
    if (!selectedFiles.length) return;

    const invalidFile = selectedFiles.find((file) => !ACCEPTED_TYPES.has(file.type) || file.size > MAX_FILE_SIZE);
    if (invalidFile) {
      showToast({ message: `“${invalidFile.name}” deve ser JPG, PNG ou WebP e ter no máximo 5 MB.`, variant: "error" });
      return;
    }

    setUploadState(true);
    const uploaded: ProductImage[] = [];

    try {
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.set("file", file);
        const response = await fetch("/api/admin/uploads", { method: "POST", body: formData });
        const result = await response.json() as UploadResponse;

        if (!response.ok || !result.url) {
          throw new Error(result.message ?? `Não foi possível enviar “${file.name}”.`);
        }

        uploaded.push({ id: newImageId(), url: result.url, label: file.name });
      }

      setImages((current) => [...current, ...uploaded]);
      showToast({ message: `${uploaded.length} ${uploaded.length === 1 ? "imagem adicionada" : "imagens adicionadas"} com sucesso.`, variant: "success" });
    } catch (error) {
      showToast({ message: error instanceof Error ? error.message : "Não foi possível enviar as imagens.", variant: "error" });
      if (uploaded.length) setImages((current) => [...current, ...uploaded]);
    } finally {
      setUploadState(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function addUrl() {
    const url = urlInput.trim();
    if (!url) return;
    if (images.length >= MAX_IMAGES) {
      showToast({ message: `Você pode cadastrar no máximo ${MAX_IMAGES} imagens.`, variant: "warning" });
      return;
    }

    try {
      const parsed = new URL(url);
      if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("invalid");
    } catch {
      showToast({ message: "Informe uma URL HTTP válida.", variant: "error" });
      return;
    }

    if (images.some((image) => image.url === url)) {
      showToast({ message: "Essa imagem já foi adicionada.", variant: "warning" });
      return;
    }

    setImages((current) => [...current, { id: newImageId(), url, label: "Imagem por URL" }]);
    setUrlInput("");
    showToast({ message: "Imagem adicionada por URL.", variant: "success" });
  }

  function makeCover(index: number) {
    setImages((current) => {
      const next = [...current];
      const [selected] = next.splice(index, 1);
      next.unshift(selected);
      return next;
    });
  }

  function moveImage(index: number, direction: -1 | 1) {
    const destination = index + direction;
    if (destination < 0 || destination >= images.length) return;

    setImages((current) => {
      const next = [...current];
      [next[index], next[destination]] = [next[destination], next[index]];
      return next;
    });
  }

  function removeImage(id: string) {
    setImages((current) => current.filter((image) => image.id !== id));
    showToast({ message: "Imagem removida da seleção. Salve o produto para confirmar.", variant: "info" });
  }

  return (
    <section className="rounded-2xl border border-black/8 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h2 className="text-lg font-black">Imagens</h2>
          <p className="mt-1 text-xs leading-5 text-black/45">Envie até {MAX_IMAGES} imagens JPG, PNG ou WebP, com no máximo 5 MB cada.</p>
        </div>
        <button
          className="focus-ring inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-domary-black px-5 text-sm font-black text-white disabled:cursor-wait disabled:opacity-50"
          disabled={uploading || images.length >= MAX_IMAGES}
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          {uploading ? "Enviando..." : "+ Escolher arquivos"}
        </button>
        <input
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          multiple
          onChange={(event) => event.target.files && void uploadFiles(event.target.files)}
          ref={inputRef}
          type="file"
        />
      </div>

      <textarea aria-hidden="true" className="hidden" name="images" readOnly value={images.map((image) => image.url).join("\n")} />

      <div className="mt-5 grid gap-4 rounded-2xl border border-domary-yellow/45 bg-domary-yellow/10 p-4 sm:grid-cols-[7rem_minmax(0,1fr)] sm:items-center sm:p-5">
        <div className="relative mx-auto grid aspect-square w-28 shrink-0 place-items-center overflow-hidden rounded-xl bg-[#f5f5f5] shadow-sm">
          <div aria-hidden="true" className="absolute inset-[9%] rounded-lg border border-dashed border-black/25" />
          <span className="text-2xl font-black">1:1</span>
          <span className="absolute bottom-3 text-[9px] font-black tracking-widest text-black/45 uppercase">Área segura</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-black">Padrão ideal para o card</p>
          <p className="mt-1 text-sm leading-6 text-black/65">
            Use imagens quadradas de <strong className="text-black">1200 × 1200 px</strong>, com o produto centralizado, fundo neutro e uma margem livre de 8% a 10% nas bordas.
          </p>
          <p className="mt-2 text-xs font-bold leading-5 text-black/50">
            Arquivos enviados pelo computador ou celular são ajustados automaticamente para 1200 × 1200 px e convertidos para WebP. Imagens adicionadas por URL devem seguir esse padrão na origem.
          </p>
        </div>
      </div>

      <button
        className="focus-ring mt-5 flex min-h-28 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-black/15 bg-black/[0.015] px-4 text-center transition-colors hover:border-domary-yellow hover:bg-domary-yellow/5 disabled:cursor-wait disabled:opacity-50"
        disabled={uploading || images.length >= MAX_IMAGES}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          if (!uploading) void uploadFiles(event.dataTransfer.files);
        }}
        type="button"
      >
        <span className="text-sm font-black">Selecione no Windows ou na galeria do celular</span>
        <span className="mt-1 text-xs text-black/40">Você também pode arrastar as imagens para esta área. O enquadramento será padronizado automaticamente.</span>
      </button>

      {images.length ? (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((image, index) => (
            <article className={`min-w-0 overflow-hidden rounded-2xl border bg-white ${index === 0 ? "border-domary-yellow ring-2 ring-domary-yellow/30" : "border-black/10"}`} key={image.id}>
              <div className="relative aspect-square overflow-hidden bg-black/[0.04]">
                <img alt={`Prévia ${index + 1}`} className="size-full object-cover" src={image.url} />
                <span className="absolute left-2 top-2 grid size-7 place-items-center rounded-full bg-domary-black text-[10px] font-black text-white">{index + 1}</span>
                {index === 0 ? <span className="absolute right-2 top-2 rounded-full bg-domary-yellow px-2 py-1 text-[9px] font-black uppercase">Capa</span> : null}
              </div>
              <div className="space-y-2 p-2.5">
                <p className="truncate text-[10px] font-bold text-black/40" title={image.label}>{image.label}</p>
                <button className="focus-ring w-full rounded-lg bg-domary-yellow/20 px-2 py-2 text-[10px] font-black disabled:text-black/35" disabled={index === 0} onClick={() => makeCover(index)} type="button">
                  {index === 0 ? "Imagem de capa" : "Definir como capa"}
                </button>
                <div className="grid grid-cols-3 gap-1">
                  <button aria-label="Mover imagem para a esquerda" className="focus-ring rounded-lg border border-black/10 py-1.5 text-xs font-black disabled:opacity-25" disabled={index === 0} onClick={() => moveImage(index, -1)} type="button">←</button>
                  <button aria-label="Mover imagem para a direita" className="focus-ring rounded-lg border border-black/10 py-1.5 text-xs font-black disabled:opacity-25" disabled={index === images.length - 1} onClick={() => moveImage(index, 1)} type="button">→</button>
                  <button aria-label="Remover imagem" className="focus-ring rounded-lg border border-red-100 py-1.5 text-xs font-black text-red-600" onClick={() => removeImage(image.id)} type="button">×</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : <div className="mt-5 rounded-2xl bg-black/[0.025] px-4 py-8 text-center text-sm text-black/40">Nenhuma imagem selecionada. A vitrine usará a ilustração padrão.</div>}

      <div className="mt-5 border-t border-black/8 pt-5">
        <label className="text-sm font-normal" htmlFor="product-image-url">Ou adicione por URL</label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input className={`${adminInputClassName} mt-0 flex-1`} id="product-image-url" onChange={(event) => setUrlInput(event.target.value)} placeholder="https://exemplo.com/produto.jpg" type="url" value={urlInput} />
          <button className="focus-ring min-h-12 rounded-xl border border-black/15 px-5 text-sm font-black disabled:opacity-50" disabled={!urlInput.trim() || uploading} onClick={addUrl} type="button">Adicionar URL</button>
        </div>
      </div>

      <AdminFieldError messages={errors} />
    </section>
  );
}
