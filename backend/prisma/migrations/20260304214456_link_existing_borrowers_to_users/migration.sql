-- Data migration: Link existing Borrower records to Users by matching email.
-- This populates Borrower.userId for historical records created before
-- the BorrowerLinkingListener was introduced (Sprint 4.5).

UPDATE "borrowers"
SET "user_id" = u."id"
FROM "users" u
WHERE "borrowers"."email" = u."email"
  AND "borrowers"."user_id" IS NULL;
