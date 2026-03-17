-- DropIndex
DROP INDEX "contact_invitations_sender_recipient_pending_idx";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "phone" VARCHAR(20);

-- Recreate partial unique index (dropped by Prisma auto-migration, must be preserved)
CREATE UNIQUE INDEX "contact_invitations_sender_recipient_pending_idx"
  ON "contact_invitations" ("sender_user_id", "recipient_email")
  WHERE "status" = 'PENDING';
