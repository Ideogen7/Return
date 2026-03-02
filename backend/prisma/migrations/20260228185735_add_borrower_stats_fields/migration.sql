-- AlterTable
ALTER TABLE "borrowers" ADD COLUMN     "average_return_delay" INTEGER,
ADD COLUMN     "not_returned" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "returned_late" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "returned_on_time" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "trust_score" SET DEFAULT 0,
ALTER COLUMN "trust_score" SET DATA TYPE DOUBLE PRECISION;
