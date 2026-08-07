import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ProductForm } from "@/components/admin/product-form";
import { getAdminProduct, getCatalogOptions } from "@/lib/admin/catalog";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [product, { categories }] = await Promise.all([getAdminProduct(id), getCatalogOptions()]);
  if (!product) notFound();

  return (
    <>
      <AdminPageHeader eyebrow="Catálogo / Produtos" title="Editar produto" description={`Atualize as informações de “${product.name}”.`} />
      <ProductForm
        categories={categories}
        product={{
          id: product.id,
          name: product.name,
          description: product.description,
          categoryId: product.categoryId,
          price: product.price.toString(),
          compareAtPrice: product.compareAtPrice?.toString() ?? "",
          status: product.status,
          isFeatured: product.isFeatured,
          variants: product.variants.map((variant) => ({
            size: variant.size,
            color: variant.color,
            colorHex: variant.colorHex,
            stockQuantity: variant.stockQuantity,
          })),
          images: product.images.map((image) => image.url).join("\n"),
        }}
      />
    </>
  );
}
