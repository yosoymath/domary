-- Preserve the closest available representation of the original insertion
-- order for existing variants, then persist all future administrator choices.
ALTER TABLE "product_variants" ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0;

WITH "ranked_variants" AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "productId"
      ORDER BY "createdAt" ASC, ctid ASC
    ) - 1 AS "variantPosition"
  FROM "product_variants"
)
UPDATE "product_variants" AS "variant"
SET "position" = "ranked_variants"."variantPosition"
FROM "ranked_variants"
WHERE "variant"."id" = "ranked_variants"."id";

CREATE INDEX "product_variants_productId_position_idx" ON "product_variants"("productId", "position");
