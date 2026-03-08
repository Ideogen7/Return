-- DropIndex
DROP INDEX "contact_invitations_sender_recipient_pending_idx";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "phone" VARCHAR(20);
