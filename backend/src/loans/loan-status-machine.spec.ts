import { LoanStatus } from '@prisma/client';
import { isValidTransition, getValidTransitions } from './loan-status-machine.js';

// =============================================================================
// Exhaustive Status Machine Tests (LOAN-017 to LOAN-020)
// =============================================================================

describe('LoanStatusMachine', () => {
  // ===========================================================================
  // VALID TRANSITIONS
  // ===========================================================================

  describe('isValidTransition — valid transitions', () => {
    const validCases: [LoanStatus, LoanStatus][] = [
      // PENDING_CONFIRMATION
      [LoanStatus.PENDING_CONFIRMATION, LoanStatus.ACTIVE],
      [LoanStatus.PENDING_CONFIRMATION, LoanStatus.ACTIVE_BY_DEFAULT],
      [LoanStatus.PENDING_CONFIRMATION, LoanStatus.CONTESTED],
      // ACTIVE
      [LoanStatus.ACTIVE, LoanStatus.AWAITING_RETURN],
      [LoanStatus.ACTIVE, LoanStatus.RETURNED],
      [LoanStatus.ACTIVE, LoanStatus.ABANDONED],
      // ACTIVE_BY_DEFAULT
      [LoanStatus.ACTIVE_BY_DEFAULT, LoanStatus.AWAITING_RETURN],
      [LoanStatus.ACTIVE_BY_DEFAULT, LoanStatus.RETURNED],
      [LoanStatus.ACTIVE_BY_DEFAULT, LoanStatus.ABANDONED],
      // AWAITING_RETURN
      [LoanStatus.AWAITING_RETURN, LoanStatus.RETURNED],
      [LoanStatus.AWAITING_RETURN, LoanStatus.NOT_RETURNED],
      [LoanStatus.AWAITING_RETURN, LoanStatus.ABANDONED],
    ];

    it.each(validCases)('%s → %s should be valid', (from, to) => {
      expect(isValidTransition(from, to)).toBe(true);
    });
  });

  // ===========================================================================
  // INVALID TRANSITIONS
  // ===========================================================================

  describe('isValidTransition — invalid transitions', () => {
    const invalidCases: [LoanStatus, LoanStatus][] = [
      // Terminal states → anything
      [LoanStatus.CONTESTED, LoanStatus.ACTIVE],
      [LoanStatus.CONTESTED, LoanStatus.PENDING_CONFIRMATION],
      [LoanStatus.RETURNED, LoanStatus.ACTIVE],
      [LoanStatus.RETURNED, LoanStatus.AWAITING_RETURN],
      [LoanStatus.NOT_RETURNED, LoanStatus.RETURNED],
      [LoanStatus.NOT_RETURNED, LoanStatus.ACTIVE],
      [LoanStatus.ABANDONED, LoanStatus.ACTIVE],
      [LoanStatus.ABANDONED, LoanStatus.RETURNED],
      // Self transitions
      [LoanStatus.PENDING_CONFIRMATION, LoanStatus.PENDING_CONFIRMATION],
      [LoanStatus.ACTIVE, LoanStatus.ACTIVE],
      [LoanStatus.AWAITING_RETURN, LoanStatus.AWAITING_RETURN],
      // Skip transitions
      [LoanStatus.PENDING_CONFIRMATION, LoanStatus.RETURNED],
      [LoanStatus.PENDING_CONFIRMATION, LoanStatus.NOT_RETURNED],
      [LoanStatus.PENDING_CONFIRMATION, LoanStatus.AWAITING_RETURN],
      [LoanStatus.ACTIVE, LoanStatus.NOT_RETURNED],
      [LoanStatus.ACTIVE, LoanStatus.CONTESTED],
      [LoanStatus.ACTIVE, LoanStatus.PENDING_CONFIRMATION],
      // Backward transitions
      [LoanStatus.AWAITING_RETURN, LoanStatus.ACTIVE],
      [LoanStatus.AWAITING_RETURN, LoanStatus.PENDING_CONFIRMATION],
    ];

    it.each(invalidCases)('%s → %s should be invalid', (from, to) => {
      expect(isValidTransition(from, to)).toBe(false);
    });
  });

  // ===========================================================================
  // TERMINAL STATES
  // ===========================================================================

  describe('terminal states have no valid transitions', () => {
    const terminalStates = [
      LoanStatus.CONTESTED,
      LoanStatus.RETURNED,
      LoanStatus.NOT_RETURNED,
      LoanStatus.ABANDONED,
    ];

    it.each(terminalStates)('%s should have 0 valid transitions', (status) => {
      expect(getValidTransitions(status)).toHaveLength(0);
    });
  });

  // ===========================================================================
  // getValidTransitions
  // ===========================================================================

  describe('getValidTransitions', () => {
    it('PENDING_CONFIRMATION → [ACTIVE, ACTIVE_BY_DEFAULT, CONTESTED]', () => {
      const transitions = getValidTransitions(LoanStatus.PENDING_CONFIRMATION);
      expect(transitions).toEqual([
        LoanStatus.ACTIVE,
        LoanStatus.ACTIVE_BY_DEFAULT,
        LoanStatus.CONTESTED,
      ]);
    });

    it('ACTIVE → [AWAITING_RETURN, RETURNED, ABANDONED]', () => {
      expect(getValidTransitions(LoanStatus.ACTIVE)).toEqual([
        LoanStatus.AWAITING_RETURN,
        LoanStatus.RETURNED,
        LoanStatus.ABANDONED,
      ]);
    });

    it('ACTIVE_BY_DEFAULT → [AWAITING_RETURN, RETURNED, ABANDONED]', () => {
      expect(getValidTransitions(LoanStatus.ACTIVE_BY_DEFAULT)).toEqual([
        LoanStatus.AWAITING_RETURN,
        LoanStatus.RETURNED,
        LoanStatus.ABANDONED,
      ]);
    });

    it('AWAITING_RETURN → [RETURNED, NOT_RETURNED, ABANDONED]', () => {
      expect(getValidTransitions(LoanStatus.AWAITING_RETURN)).toEqual([
        LoanStatus.RETURNED,
        LoanStatus.NOT_RETURNED,
        LoanStatus.ABANDONED,
      ]);
    });
  });

  // ===========================================================================
  // EXHAUSTIVE: all 64 possible transitions
  // ===========================================================================

  describe('exhaustive coverage — all 64 transitions (8×8)', () => {
    const allStatuses = Object.values(LoanStatus);
    const expectedValid = new Set([
      'PENDING_CONFIRMATION→ACTIVE',
      'PENDING_CONFIRMATION→ACTIVE_BY_DEFAULT',
      'PENDING_CONFIRMATION→CONTESTED',
      'ACTIVE→AWAITING_RETURN',
      'ACTIVE→RETURNED',
      'ACTIVE→ABANDONED',
      'ACTIVE_BY_DEFAULT→AWAITING_RETURN',
      'ACTIVE_BY_DEFAULT→RETURNED',
      'ACTIVE_BY_DEFAULT→ABANDONED',
      'AWAITING_RETURN→RETURNED',
      'AWAITING_RETURN→NOT_RETURNED',
      'AWAITING_RETURN→ABANDONED',
    ]);

    for (const from of allStatuses) {
      for (const to of allStatuses) {
        const key = `${from}→${to}`;
        const shouldBeValid = expectedValid.has(key);

        it(`${key} should be ${shouldBeValid ? 'VALID' : 'INVALID'}`, () => {
          expect(isValidTransition(from, to)).toBe(shouldBeValid);
        });
      }
    }
  });
});
