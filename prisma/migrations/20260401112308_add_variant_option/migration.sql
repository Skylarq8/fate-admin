/*
  Warnings:

  - You are about to drop the column `variantKey` on the `ProductImage` table. All the data in the column will be lost.
  - You are about to drop the column `variantValue` on the `ProductImage` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ProductImage" DROP COLUMN "variantKey",
DROP COLUMN "variantValue";
