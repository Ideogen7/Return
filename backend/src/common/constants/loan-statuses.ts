// =============================================================================
// Shared active loan statuses — single source of truth
// =============================================================================
// Used across modules (Items, Borrowers, Users) to determine if a loan
// is considered "active" (item unavailable, borrower/account cannot be deleted).
// =============================================================================

import { LoanStatus } from '@prisma/client';

/**
 * Statuses where a loan is considered "active" (not yet resolved).
 * An active loan blocks item deletion, borrower deletion, and account deletion.
 */
export const ACTIVE_LOAN_STATUSES: LoanStatus[] = [
  LoanStatus.PENDING_CONFIRMATION,
  LoanStatus.ACTIVE,
  LoanStatus.ACTIVE_BY_DEFAULT,
  LoanStatus.AWAITING_RETURN,
];
