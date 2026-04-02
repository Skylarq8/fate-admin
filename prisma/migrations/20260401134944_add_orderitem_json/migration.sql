/*
  Warnings:

  - The `variants` column on the `OrderItem` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "OrderItem" DROP COLUMN "variants",
ADD COLUMN     "variants" JSONB;
