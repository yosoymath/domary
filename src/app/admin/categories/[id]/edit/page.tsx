import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { CategoryForm } from "@/components/admin/category-form";
import { getAdminCategory } from "@/lib/admin/catalog";

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const category = await getAdminCategory(id);
  if (!category) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <AdminPageHeader eyebrow="Catálogo / Categorias" title="Editar categoria" description={`Atualize a apresentação de “${category.name}”.`} />
      <CategoryForm category={{ id: category.id, name: category.name, description: category.description ?? "", imageUrl: category.imageUrl ?? "", isActive: category.isActive }} />
    </div>
  );
}
