"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { createProduct, updateProduct } from "@/actions/admin";
import { AdminFieldError, AdminFormAlert, adminInputClassName, adminSelectClassName, adminTextareaClassName } from "@/components/admin/form-elements";
import { ProductImageManager } from "@/components/admin/product-image-manager";
import { ProductVariantEditor, type ProductVariantFormValue } from "@/components/admin/product-variant-editor";
import { RequiredMark } from "@/components/ui/required-mark";
import type { AdminActionState } from "@/lib/validations/admin";

type ProductFormValue = {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  price: string;
  compareAtPrice: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  isFeatured: boolean;
  variants: ProductVariantFormValue[];
  images: string;
};

type ProductFormProps = {
  categories: Array<{ id: string; name: string; isActive: boolean }>;
  product?: ProductFormValue;
};

const initialState: AdminActionState = {};

export function ProductForm({ categories, product }: ProductFormProps) {
  const action = product ? updateProduct.bind(null, product.id) : createProduct;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [uploadingImages, setUploadingImages] = useState(false);

  return (
    <form action={formAction} className="space-y-7" onSubmit={(event) => {
      if (uploadingImages) event.preventDefault();
    }}>
      <AdminFormAlert message={state.message} />

      <section className="rounded-2xl border border-black/8 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-lg font-black">Informações principais</h2>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <label className="text-sm font-normal md:col-span-2">
            Título do produto<RequiredMark />
            <input className={adminInputClassName} defaultValue={product?.name} maxLength={120} name="name" placeholder="Ex.: Camiseta Essential" required />
            <AdminFieldError messages={state.fieldErrors?.name} />
          </label>

          <label className="text-sm font-normal">
            Categoria<RequiredMark />
            <select className={adminSelectClassName} defaultValue={product?.categoryId ?? ""} name="categoryId" required>
              <option disabled value="">Selecione uma categoria</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}{category.isActive ? "" : " (inativa)"}</option>)}
            </select>
            <AdminFieldError messages={state.fieldErrors?.categoryId} />
          </label>

          <label className="text-sm font-normal">
            Status
            <select className={adminSelectClassName} defaultValue={product?.status ?? "DRAFT"} name="status">
              <option value="DRAFT">Rascunho</option>
              <option value="ACTIVE">Ativo na loja</option>
              <option value="ARCHIVED">Arquivado</option>
            </select>
            <AdminFieldError messages={state.fieldErrors?.status} />
          </label>

          <label className="text-sm font-normal md:col-span-2">
            Descrição<RequiredMark />
            <textarea className={adminTextareaClassName} defaultValue={product?.description} maxLength={5000} name="description" placeholder="Descreva materiais, caimento e diferenciais da peça." required />
            <AdminFieldError messages={state.fieldErrors?.description} />
          </label>

          <label className="flex items-center gap-3 text-sm font-normal md:col-span-2">
            <input className="size-4 accent-domary-yellow" defaultChecked={product?.isFeatured} name="isFeatured" type="checkbox" />
            Exibir como destaque na vitrine
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-black/8 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-lg font-black">Preço e estoque</h2>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <label className="text-sm font-normal">
            Preço atual (R$)<RequiredMark />
            <input className={adminInputClassName} defaultValue={product?.price} inputMode="decimal" min="0.01" name="price" placeholder="89,90" required step="0.01" type="number" />
            <AdminFieldError messages={state.fieldErrors?.price} />
          </label>

          <label className="text-sm font-normal">
            Preço anterior (R$)
            <input className={adminInputClassName} defaultValue={product?.compareAtPrice} inputMode="decimal" min="0.01" name="compareAtPrice" placeholder="Opcional" step="0.01" type="number" />
            <AdminFieldError messages={state.fieldErrors?.compareAtPrice} />
          </label>

          <ProductVariantEditor errors={state.fieldErrors?.variants} initialVariants={product?.variants} />
        </div>
      </section>

      <ProductImageManager
        errors={state.fieldErrors?.images}
        initialImages={product?.images.split("\n").map((url) => url.trim()).filter(Boolean) ?? []}
        onUploadingChange={setUploadingImages}
      />

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link className="focus-ring inline-flex min-h-12 items-center justify-center rounded-full border border-black/15 px-6 text-sm font-extrabold" href="/admin/products">Cancelar</Link>
        <button className="focus-ring min-h-12 rounded-full bg-domary-yellow px-7 text-sm font-black text-domary-black transition hover:bg-domary-yellow-light disabled:cursor-wait disabled:opacity-60" disabled={pending || uploadingImages} type="submit">
          {uploadingImages ? "Aguarde o envio..." : pending ? "Salvando..." : product ? "Salvar alterações" : "Adicionar produto"}
        </button>
      </div>
    </form>
  );
}
