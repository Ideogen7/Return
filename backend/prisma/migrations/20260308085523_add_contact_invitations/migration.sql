-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- CreateTable
CREATE TABLE "contact_invitations" (
    "id" UUID NOT NULL,
    "sender_user_id" UUID NOT NULL,
    "recipient_email" TEXT NOT NULL,
    "recipient_user_id" UUID NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "rejected_at" TIMESTAMP(3),

    CONSTRAINT "contact_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contact_invitations_sender_user_id_idx" ON "contact_invitations"("sender_user_id");

-- CreateIndex
CREATE INDEX "contact_invitations_recipient_user_id_idx" ON "contact_invitations"("recipient_user_id");

-- CreateIndex
CREATE INDEX "contact_invitations_status_idx" ON "contact_invitations"("status");

-- Partial unique index: only one PENDING invitation per (sender, recipientEmail)
-- Prisma does not support partial indexes natively, so we add it via raw SQL.
CREATE UNIQUE INDEX "contact_invitations_sender_recipient_pending_idx"
  ON "contact_invitations" ("sender_user_id", "recipient_email")
  WHERE "status" = 'PENDING';

-- AddForeignKey
ALTER TABLE "contact_invitations" ADD CONSTRAINT "contact_invitations_sender_user_id_fkey" FOREIGN KEY ("sender_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_invitations" ADD CONSTRAINT "contact_invitations_recipient_user_id_fkey" FOREIGN KEY ("recipient_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
