import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { PromotionForm } from "@/components/admin/promotion-form";
import { getCatalogOptions } from "@/lib/admin/catalog";

export default async function NewPromotionPage() {
  const options = await getCatalogOptions();
  return <><AdminPageHeader eyebrow="Marketing / Promoções" title="Criar promoção" description="Defina o desconto, a vigência e onde ele será aplicado." /><PromotionForm {...options} /></>;
}
