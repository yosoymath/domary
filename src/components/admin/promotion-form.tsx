"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createPromotion, updatePromotion } from "@/actions/admin";
import { AdminFieldError, AdminFormAlert, adminInputClassName, adminTextareaClassName } from "@/components/admin/form-elements";
import { RequiredMark } from "@/components/ui/required-mark";
import type { AdminActionState } from "@/lib/validations/admin";

type PromotionValue = {
  id: string;
  name: string;
  code: string;
  description: string;
  percentage: string;
  isActive: boolean;
  startsAt: string;
  endsAt: string;
  productIds: string[];
  categoryIds: string[];
};

type PromotionFormProps = {
  promotion?: PromotionValue;
  products: Array<{ id: string; name: string; status: string }>;
  categories: Array<{ id: string; name: string; isActive: boolean }>;
};

export function PromotionForm({ promotion, products, categories }: PromotionFormProps) {
  const action = promotion ? updatePromotion.bind(null, promotion.id) : createPromotion;
  const [state, formAction, pending] = useActionState(action, {} as AdminActionState);
  const selectedProducts = new Set(promotion?.productIds ?? []);
  const selectedCategories = new Set(promotion?.categoryIds ?? []);

  return (
    <form action={formAction} className="space-y-7">
      <AdminFormAlert message={state.message} />

      <section className="rounded-2xl border border-black/8 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-lg font-black">Dados da promoção</h2>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <label className="text-sm font-normal md:col-span-2">
            Nome<RequiredMark />
            <input className={adminInputClassName} defaultValue={promotion?.name} maxLength={120} name="name" placeholder="Ex.: Semana Domary" required />
            <AdminFieldError messages={state.fieldErrors?.name} />
          </label>
          <label className="text-sm font-normal">
            Porcentagem de desconto<RequiredMark />
            <input className={adminInputClassName} defaultValue={promotion?.percentage} max="100" min="0.01" name="percentage" required step="0.01" type="number" />
            <AdminFieldError messages={state.fieldErrors?.percentage} />
          </label>
          <label className="text-sm font-normal">
            Código promocional
            <input className={adminInputClassName} defaultValue={promotion?.code} maxLength={40} name="code" placeholder="DOMARY20 (opcional)" />
            <AdminFieldError messages={state.fieldErrors?.code} />
          </label>
          <label className="text-sm font-normal">
            Início
            <input className={adminInputClassName} defaultValue={promotion?.startsAt} name="startsAt" type="datetime-local" />
          </label>
          <label className="text-sm font-normal">
            Término
            <input className={adminInputClassName} defaultValue={promotion?.endsAt} name="endsAt" type="datetime-local" />
          </label>
          <label className="text-sm font-normal md:col-span-2">
            Descrição
            <textarea className={adminTextareaClassName} defaultValue={promotion?.description} maxLength={500} name="description" />
          </label>
          <label className="flex items-center gap-3 text-sm font-normal md:col-span-2">
            <input className="size-4 accent-domary-yellow" defaultChecked={promotion?.isActive ?? true} name="isActive" type="checkbox" />
            Promoção ativa
          </label>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-black/8 bg-white p-5 shadow-sm sm:p-7">
          <h2 className="text-lg font-black">Categorias participantes</h2>
          <p className="mt-1 text-xs text-black/45">Marque uma ou mais categorias. É possível combinar com produtos específicos.</p>
          <div className="mt-4 max-h-64 space-y-2 overflow-y-auto">
            {categories.map((category) => (
              <label className="flex items-center gap-3 rounded-xl border border-black/8 px-3 py-2.5 text-sm font-normal" key={category.id}>
                <input className="size-4 accent-domary-yellow" defaultChecked={selectedCategories.has(category.id)} name="categoryIds" type="checkbox" value={category.id} />
                <span>{category.name}{category.isActive ? "" : " (inativa)"}</span>
              </label>
            ))}
            {!categories.length ? <p className="text-sm text-black/40">Nenhuma categoria cadastrada.</p> : null}
          </div>
        </div>

        <div className="rounded-2xl border border-black/8 bg-white p-5 shadow-sm sm:p-7">
          <h2 className="text-lg font-black">Produtos específicos</h2>
          <p className="mt-1 text-xs text-black/45">Use para campanhas direcionadas a peças individuais.</p>
          <div className="mt-4 max-h-64 space-y-2 overflow-y-auto">
            {products.map((product) => (
              <label className="flex items-center gap-3 rounded-xl border border-black/8 px-3 py-2.5 text-sm font-normal" key={product.id}>
                <input className="size-4 accent-domary-yellow" defaultChecked={selectedProducts.has(product.id)} name="productIds" type="checkbox" value={product.id} />
                <span>{product.name}{product.status === "ACTIVE" ? "" : ` (${product.status.toLowerCase()})`}</span>
              </label>
            ))}
            {!products.length ? <p className="text-sm text-black/40">Nenhum produto cadastrado.</p> : null}
          </div>
        </div>
      </section>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link className="focus-ring inline-flex min-h-12 items-center justify-center rounded-full border border-black/15 px-6 text-sm font-extrabold" href="/admin/promotions">Cancelar</Link>
        <button className="focus-ring min-h-12 rounded-full bg-domary-yellow px-7 text-sm font-black disabled:cursor-wait disabled:opacity-60" disabled={pending} type="submit">
          {pending ? "Salvando..." : promotion ? "Salvar promoção" : "Criar promoção"}
        </button>
      </div>
    </form>
  );
}
