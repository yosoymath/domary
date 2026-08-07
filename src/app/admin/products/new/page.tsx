import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ProductForm } from "@/components/admin/product-form";
import { getCatalogOptions } from "@/lib/admin/catalog";

export default async function NewProductPage() {
  const { categories } = await getCatalogOptions();

  return (
    <>
      <AdminPageHeader eyebrow="Catálogo / Produtos" title="Adicionar produto" description="Cadastre os dados comerciais, a grade e o estoque inicial da peça." />
      {!categories.length ? <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">Crie uma categoria antes de adicionar um produto.</div> : null}
      <ProductForm categories={categories} />
    </>
  );
}
