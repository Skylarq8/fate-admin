/*
  Warnings:

  - You are about to drop the column `discount` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `stock` on the `ProductVariant` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Product" DROP COLUMN "discount",
ADD COLUMN     "discountEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "discountEndsAt" TIMESTAMP(3),
ADD COLUMN     "finalPrice" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "ProductVariant" DROP COLUMN "stock";
