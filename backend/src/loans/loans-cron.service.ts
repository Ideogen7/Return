import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service.js';
import { LOAN_EVENTS } from '../common/events/loan.events.js';
import { LoanStatus } from '@prisma/client';
import type { LoanStatusChangedEvent } from '../common/events/loan.events.js';

/**
 * CRON job: auto-confirm pending loans after 48h.
 *
 * Runs every hour to find loans in PENDING_CONFIRMATION status
 * that were created more than 48 hours ago and transitions them
 * to ACTIVE_BY_DEFAULT.
 *
 * Ref: LOAN-022 / LOAN-023
 */
@Injectable()
export class LoansCronService {
  private readonly logger = new Logger(LoansCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handlePendingTimeout(): Promise<void> {
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const expiredLoans = await this.prisma.loan.findMany({
      where: {
        status: LoanStatus.PENDING_CONFIRMATION,
        createdAt: { lt: cutoff },
        deletedAt: null,
      },
      select: { id: true, borrowerId: true, lenderId: true },
    });

    if (expiredLoans.length === 0) return;

    this.logger.log(`Auto-confirming ${expiredLoans.length} pending loan(s) older than 48h`);

    // Batch update all expired loans
    await this.prisma.loan.updateMany({
      where: {
        id: { in: expiredLoans.map((l) => l.id) },
      },
      data: {
        status: LoanStatus.ACTIVE_BY_DEFAULT,
        confirmationDate: new Date(),
      },
    });

    // Emit events for each transitioned loan
    for (const loan of expiredLoans) {
      const event: LoanStatusChangedEvent = {
        loanId: loan.id,
        borrowerId: loan.borrowerId,
        lenderUserId: loan.lenderId,
        previousStatus: LoanStatus.PENDING_CONFIRMATION,
        newStatus: LoanStatus.ACTIVE_BY_DEFAULT,
      };
      this.eventEmitter.emit(LOAN_EVENTS.STATUS_CHANGED, event);
    }
  }
}
