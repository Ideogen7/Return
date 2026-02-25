-- CreateTable
CREATE TABLE "borrowers" (
    "id" UUID NOT NULL,
    "first_name" VARCHAR(50) NOT NULL,
    "last_name" VARCHAR(50) NOT NULL,
    "email" TEXT NOT NULL,
    "phone_number" TEXT,
    "user_id" UUID,
    "lender_user_id" UUID NOT NULL,
    "trust_score" INTEGER NOT NULL DEFAULT 0,
    "total_loans" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "borrowers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "borrowers_lender_user_id_idx" ON "borrowers"("lender_user_id");

-- CreateIndex
CREATE INDEX "borrowers_user_id_idx" ON "borrowers"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "borrowers_lender_user_id_email_key" ON "borrowers"("lender_user_id", "email");

-- AddForeignKey
ALTER TABLE "borrowers" ADD CONSTRAINT "borrowers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "borrowers" ADD CONSTRAINT "borrowers_lender_user_id_fkey" FOREIGN KEY ("lender_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
