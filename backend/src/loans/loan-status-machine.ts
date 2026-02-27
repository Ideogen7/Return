import { LoanStatus } from '@prisma/client';

/**
 * Defines valid loan status transitions.
 *
 * Transitions:
 * - PENDING_CONFIRMATION → ACTIVE (borrower confirms, or timeout 48h)
 * - PENDING_CONFIRMATION → ACTIVE_BY_DEFAULT (system timeout 48h)
 * - PENDING_CONFIRMATION → CONTESTED (borrower contests)
 * - ACTIVE → AWAITING_RETURN (system: returnDate exceeded)
 * - ACTIVE → RETURNED (lender confirms return)
 * - ACTIVE → ABANDONED (lender abandons)
 * - ACTIVE_BY_DEFAULT → AWAITING_RETURN (system: returnDate exceeded)
 * - ACTIVE_BY_DEFAULT → RETURNED (lender confirms return)
 * - ACTIVE_BY_DEFAULT → ABANDONED (lender abandons)
 * - AWAITING_RETURN → RETURNED (lender confirms late return)
 * - AWAITING_RETURN → NOT_RETURNED (system: all reminders exhausted)
 * - AWAITING_RETURN → ABANDONED (lender abandons)
 */
const VALID_TRANSITIONS: Record<string, LoanStatus[]> = {
  [LoanStatus.PENDING_CONFIRMATION]: [
    LoanStatus.ACTIVE,
    LoanStatus.ACTIVE_BY_DEFAULT,
    LoanStatus.CONTESTED,
  ],
  [LoanStatus.ACTIVE]: [LoanStatus.AWAITING_RETURN, LoanStatus.RETURNED, LoanStatus.ABANDONED],
  [LoanStatus.ACTIVE_BY_DEFAULT]: [
    LoanStatus.AWAITING_RETURN,
    LoanStatus.RETURNED,
    LoanStatus.ABANDONED,
  ],
  [LoanStatus.AWAITING_RETURN]: [
    LoanStatus.RETURNED,
    LoanStatus.NOT_RETURNED,
    LoanStatus.ABANDONED,
  ],
  [LoanStatus.CONTESTED]: [],
  [LoanStatus.RETURNED]: [],
  [LoanStatus.NOT_RETURNED]: [],
  [LoanStatus.ABANDONED]: [],
};

export function isValidTransition(currentStatus: LoanStatus, newStatus: LoanStatus): boolean {
  const allowed = VALID_TRANSITIONS[currentStatus];
  if (!allowed) return false;
  return allowed.includes(newStatus);
}

export function getValidTransitions(currentStatus: LoanStatus): LoanStatus[] {
  return VALID_TRANSITIONS[currentStatus] ?? [];
}
