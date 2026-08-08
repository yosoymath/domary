-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('FEMALE', 'MALE', 'NON_BINARY', 'OTHER', 'PREFER_NOT_TO_SAY');

-- AlterTable
ALTER TABLE "users"
ADD COLUMN "cpf" VARCHAR(11),
ADD COLUMN "birthDate" DATE,
ADD COLUMN "gender" "Gender";

-- CreateTable
CREATE TABLE "customer_addresses" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "postalCode" VARCHAR(8) NOT NULL,
    "street" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "complement" TEXT,
    "district" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" CHAR(2) NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_cpf_key" ON "users"("cpf");

-- CreateIndex
CREATE INDEX "customer_addresses_userId_isPrimary_idx" ON "customer_addresses"("userId", "isPrimary");

-- CreateIndex
CREATE INDEX "customer_addresses_userId_createdAt_idx" ON "customer_addresses"("userId", "createdAt");

-- Garante no banco que cada cliente tenha no máximo um endereço principal.
CREATE UNIQUE INDEX "customer_addresses_one_primary_per_user_idx" ON "customer_addresses"("userId") WHERE "isPrimary" = true;

-- AddForeignKey
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
