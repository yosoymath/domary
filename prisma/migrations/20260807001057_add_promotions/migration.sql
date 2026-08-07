-- CreateTable
CREATE TABLE "promotions" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "percentage" DECIMAL(5,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CategoryToPromotion" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_CategoryToPromotion_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ProductToPromotion" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_ProductToPromotion_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "promotions_code_key" ON "promotions"("code");

-- CreateIndex
CREATE INDEX "promotions_isActive_startsAt_endsAt_idx" ON "promotions"("isActive", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "_CategoryToPromotion_B_index" ON "_CategoryToPromotion"("B");

-- CreateIndex
CREATE INDEX "_ProductToPromotion_B_index" ON "_ProductToPromotion"("B");

-- AddForeignKey
ALTER TABLE "_CategoryToPromotion" ADD CONSTRAINT "_CategoryToPromotion_A_fkey" FOREIGN KEY ("A") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryToPromotion" ADD CONSTRAINT "_CategoryToPromotion_B_fkey" FOREIGN KEY ("B") REFERENCES "promotions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductToPromotion" ADD CONSTRAINT "_ProductToPromotion_A_fkey" FOREIGN KEY ("A") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductToPromotion" ADD CONSTRAINT "_ProductToPromotion_B_fkey" FOREIGN KEY ("B") REFERENCES "promotions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
