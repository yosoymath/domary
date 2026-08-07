"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createCategory, updateCategory } from "@/actions/admin";
import { AdminFieldError, AdminFormAlert, adminInputClassName, adminTextareaClassName } from "@/components/admin/form-elements";
import { RequiredMark } from "@/components/ui/required-mark";
import type { AdminActionState } from "@/lib/validations/admin";

type CategoryValue = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  isActive: boolean;
};

export function CategoryForm({ category }: { category?: CategoryValue }) {
  const action = category ? updateCategory.bind(null, category.id) : createCategory;
  const [state, formAction, pending] = useActionState(action, {} as AdminActionState);

  return (
    <form action={formAction} className="space-y-5 rounded-2xl border border-black/8 bg-white p-5 shadow-sm sm:p-7">
      <AdminFormAlert message={state.message} />
      <label className="block text-sm font-normal">
        Nome<RequiredMark />
        <input className={adminInputClassName} defaultValue={category?.name} maxLength={80} name="name" placeholder="Ex.: Roupas" required />
        <AdminFieldError messages={state.fieldErrors?.name} />
      </label>
      <label className="block text-sm font-normal">
        Descrição
        <textarea className={adminTextareaClassName} defaultValue={category?.description} maxLength={500} name="description" placeholder="Descrição curta da categoria." />
        <AdminFieldError messages={state.fieldErrors?.description} />
      </label>
      <label className="block text-sm font-normal">
        URL da imagem
        <input className={adminInputClassName} defaultValue={category?.imageUrl} name="imageUrl" placeholder="https://..." type="url" />
        <AdminFieldError messages={state.fieldErrors?.imageUrl} />
      </label>
      <label className="flex items-center gap-3 text-sm font-normal">
        <input className="size-4 accent-domary-yellow" defaultChecked={category?.isActive ?? true} name="isActive" type="checkbox" />
        Categoria ativa
      </label>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        {category ? <Link className="focus-ring inline-flex min-h-11 items-center justify-center rounded-full border border-black/15 px-5 text-sm font-extrabold" href="/admin/categories">Cancelar</Link> : null}
        <button className="focus-ring min-h-11 rounded-full bg-domary-yellow px-6 text-sm font-black disabled:cursor-wait disabled:opacity-60" disabled={pending} type="submit">
          {pending ? "Salvando..." : category ? "Salvar categoria" : "Criar categoria"}
        </button>
      </div>
    </form>
  );
}
