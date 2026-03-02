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
 * Updates all BorrowerStatistics fields (OpenAPI spec):
 * - totalLoans: incremented on creation, decremented on deletion
 * - returnedOnTime, returnedLate, notReturned: recalculated on status changes
 * - averageReturnDelay: integer, computed from returnedDate vs returnDate
 * - trustScore: float, formula = (returnedOnTime * 100 + returnedLate * 50) / totalLoans
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

    // Recalculate all stats when a loan reaches RETURNED, NOT_RETURNED, or ABANDONED
    if (
      event.newStatus === 'RETURNED' ||
      event.newStatus === 'NOT_RETURNED' ||
      event.newStatus === 'ABANDONED'
    ) {
      await this.recalculateStats(event.borrowerId);
    }
  }

  @OnEvent(LOAN_EVENTS.DELETED)
  async handleLoanDeleted(event: LoanDeletedEvent): Promise<void> {
    this.logger.debug(`Loan deleted: ${event.loanId} for borrower ${event.borrowerId}`);

    const borrower = await this.prisma.borrower.findUnique({
      where: { id: event.borrowerId },
      select: { totalLoans: true },
    });

    if (borrower && borrower.totalLoans > 0) {
      await this.prisma.borrower.update({
        where: { id: event.borrowerId },
        data: { totalLoans: { decrement: 1 } },
      });

      await this.recalculateStats(event.borrowerId);
    }
  }

  /**
   * Recalculates ALL borrower statistics from loan data.
   *
   * - returnedOnTime: RETURNED loans where returnedDate <= returnDate (or no returnDate)
   * - returnedLate: RETURNED loans where returnedDate > returnDate
   * - notReturned: NOT_RETURNED + ABANDONED loans
   * - averageReturnDelay: integer days (+ = late, - = early), null if no dated returns
   * - trustScore: float = (returnedOnTime * 100 + returnedLate * 50) / totalLoans
   */
  private async recalculateStats(borrowerId: string): Promise<void> {
    const borrower = await this.prisma.borrower.findUnique({
      where: { id: borrowerId },
      select: { totalLoans: true },
    });

    if (!borrower || borrower.totalLoans === 0) {
      await this.prisma.borrower.update({
        where: { id: borrowerId },
        data: {
          trustScore: 0,
          returnedOnTime: 0,
          returnedLate: 0,
          notReturned: 0,
          averageReturnDelay: null,
        },
      });
      return;
    }

    // Fetch RETURNED loans with dates for on-time/late classification
    const returnedLoans = await this.prisma.loan.findMany({
      where: { borrowerId, status: 'RETURNED', deletedAt: null },
      select: { returnDate: true, returnedDate: true },
    });

    let returnedOnTime = 0;
    let returnedLate = 0;
    let totalDelayDays = 0;
    let loansWithDelay = 0;

    for (const loan of returnedLoans) {
      if (!loan.returnDate || !loan.returnedDate) {
        // No planned return date = cannot be late → on time
        returnedOnTime++;
        continue;
      }

      const delayMs = loan.returnedDate.getTime() - loan.returnDate.getTime();
      const delayDays = delayMs / (1000 * 60 * 60 * 24);

      if (delayDays <= 0) {
        returnedOnTime++;
      } else {
        returnedLate++;
      }

      totalDelayDays += delayDays;
      loansWithDelay++;
    }

    // Count NOT_RETURNED + ABANDONED (OpenAPI: "non rendus (abandonné)")
    const notReturned = await this.prisma.loan.count({
      where: {
        borrowerId,
        status: { in: ['NOT_RETURNED', 'ABANDONED'] },
        deletedAt: null,
      },
    });

    // averageReturnDelay: integer days, null if no loans with both dates
    const averageReturnDelay =
      loansWithDelay > 0 ? Math.round(totalDelayDays / loansWithDelay) : null;

    // trustScore formula (OpenAPI): (returnedOnTime * 100 + returnedLate * 50) / totalLoans
    const trustScore = (returnedOnTime * 100 + returnedLate * 50) / borrower.totalLoans;

    await this.prisma.borrower.update({
      where: { id: borrowerId },
      data: { returnedOnTime, returnedLate, notReturned, averageReturnDelay, trustScore },
    });
  }
}
