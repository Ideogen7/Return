-- CreateEnum
CREATE TYPE "LoanStatus" AS ENUM ('PENDING_CONFIRMATION', 'ACTIVE', 'ACTIVE_BY_DEFAULT', 'CONTESTED', 'AWAITING_RETURN', 'RETURNED', 'NOT_RETURNED', 'ABANDONED');

-- CreateTable
CREATE TABLE "loans" (
    "id" UUID NOT NULL,
    "item_id" UUID NOT NULL,
    "lender_id" UUID NOT NULL,
    "borrower_id" UUID NOT NULL,
    "status" "LoanStatus" NOT NULL DEFAULT 'PENDING_CONFIRMATION',
    "return_date" DATE,
    "confirmation_date" TIMESTAMP(3),
    "returned_date" TIMESTAMP(3),
    "contest_reason" VARCHAR(500),
    "notes" VARCHAR(500),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "loans_lender_id_status_idx" ON "loans"("lender_id", "status");

-- CreateIndex
CREATE INDEX "loans_borrower_id_idx" ON "loans"("borrower_id");

-- CreateIndex
CREATE INDEX "loans_item_id_idx" ON "loans"("item_id");

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_lender_id_fkey" FOREIGN KEY ("lender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_borrower_id_fkey" FOREIGN KEY ("borrower_id") REFERENCES "borrowers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
