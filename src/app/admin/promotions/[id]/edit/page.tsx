import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { PromotionForm } from "@/components/admin/promotion-form";
import { getAdminPromotion, getCatalogOptions } from "@/lib/admin/catalog";

function toDateTimeLocal(value: Date | null) {
  if (!value) return "";
  const offset = value.getTimezoneOffset();
  return new Date(value.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

export default async function EditPromotionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [promotion, options] = await Promise.all([getAdminPromotion(id), getCatalogOptions()]);
  if (!promotion) notFound();

  return (
    <>
      <AdminPageHeader eyebrow="Marketing / Promoções" title="Editar promoção" description={`Ajuste a campanha “${promotion.name}”.`} />
      <PromotionForm
        {...options}
        promotion={{
          id: promotion.id,
          name: promotion.name,
          code: promotion.code ?? "",
          description: promotion.description ?? "",
          percentage: promotion.percentage.toString(),
          isActive: promotion.isActive,
          startsAt: toDateTimeLocal(promotion.startsAt),
          endsAt: toDateTimeLocal(promotion.endsAt),
          productIds: promotion.products.map((product) => product.id),
          categoryIds: promotion.categories.map((category) => category.id),
        }}
      />
    </>
  );
}
