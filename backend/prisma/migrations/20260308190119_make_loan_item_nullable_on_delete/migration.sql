-- DropForeignKey
ALTER TABLE "loans" DROP CONSTRAINT "loans_item_id_fkey";

-- AlterTable
ALTER TABLE "loans" ALTER COLUMN "item_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
