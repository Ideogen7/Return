import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service.js';
import { LOAN_EVENTS } from '../common/events/loan.events.js';
import type {
  LoanCreatedEvent,
  LoanStatusChangedEvent,
  LoanDeletedEvent,
} from '../common/events/loan.events.js';

/**
 * Listens to loan events and updates denormalized borrower statistics.
 *
 * Ref: LOAN-037 — Sprint 4, Phase 4.5
 *
 * Updates:
 * - `Borrower.totalLoans` on loan creation/deletion
 * - `Borrower.trustScore` on status changes (RETURNED, NOT_RETURNED)
 *
 * trustScore formula (from OpenAPI):
 *   (returnedOnTime × 100 + returnedLate × 50) / totalLoans
 *
 * For the MVP, we use a simplified increment approach:
 * - RETURNED: trustScore goes up proportionally
 * - NOT_RETURNED: trustScore stays or decreases
 */
@Injectable()
export class BorrowerStatsListener {
  private readonly logger = new Logger(BorrowerStatsListener.name);

  constructor(private readonly prisma: PrismaService) {}

  @OnEvent(LOAN_EVENTS.CREATED)
  async handleLoanCreated(event: LoanCreatedEvent): Promise<void> {
    this.logger.debug(`Loan created: ${event.loanId} for borrower ${event.borrowerId}`);

    await this.prisma.borrower.update({
      where: { id: event.borrowerId },
      data: { totalLoans: { increment: 1 } },
    });
  }

  @OnEvent(LOAN_EVENTS.STATUS_CHANGED)
  async handleStatusChanged(event: LoanStatusChangedEvent): Promise<void> {
    this.logger.debug(`Loan ${event.loanId}: ${event.previousStatus} → ${event.newStatus}`);

    // Recalculate trustScore when a loan reaches a terminal RETURNED or NOT_RETURNED status
    if (event.newStatus === 'RETURNED' || event.newStatus === 'NOT_RETURNED') {
      await this.recalculateTrustScore(event.borrowerId);
    }
  }

  @OnEvent(LOAN_EVENTS.DELETED)
  async handleLoanDeleted(event: LoanDeletedEvent): Promise<void> {
    this.logger.debug(`Loan deleted: ${event.loanId} for borrower ${event.borrowerId}`);

    // Only decrement if the loan had actually been counted
    const borrower = await this.prisma.borrower.findUnique({
      where: { id: event.borrowerId },
      select: { totalLoans: true },
    });

    if (borrower && borrower.totalLoans > 0) {
      await this.prisma.borrower.update({
        where: { id: event.borrowerId },
        data: { totalLoans: { decrement: 1 } },
      });

      // Recalculate trustScore after decrement
      await this.recalculateTrustScore(event.borrowerId);
    }
  }

  /**
   * Recalculates trustScore based on actual loan outcomes.
   *
   * Formula: (returnedOnTime × 100 + returnedLate × 50) / totalLoans
   *
   * For MVP: all RETURNED loans count as "on time" (100 points each).
   * Late detection will be added when reminders are implemented (Sprint 5).
   */
  private async recalculateTrustScore(borrowerId: string): Promise<void> {
    const borrower = await this.prisma.borrower.findUnique({
      where: { id: borrowerId },
      select: { totalLoans: true },
    });

    if (!borrower || borrower.totalLoans === 0) {
      await this.prisma.borrower.update({
        where: { id: borrowerId },
        data: { trustScore: 0 },
      });
      return;
    }

    // Count returned loans for this borrower
    const returnedCount = await this.prisma.loan.count({
      where: {
        borrowerId,
        status: 'RETURNED',
        deletedAt: null,
      },
    });

    // MVP formula: returnedOnTime * 100 / totalLoans (all returns are "on time" for now)
    const trustScore = Math.round((returnedCount * 100) / borrower.totalLoans);

    await this.prisma.borrower.update({
      where: { id: borrowerId },
      data: { trustScore },
    });
  }
}
