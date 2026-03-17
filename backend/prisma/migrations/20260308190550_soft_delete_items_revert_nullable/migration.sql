/*
  Warnings:

  - Made the column `item_id` on table `loans` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "loans" DROP CONSTRAINT "loans_item_id_fkey";

-- AlterTable
ALTER TABLE "items" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "loans" ALTER COLUMN "item_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
