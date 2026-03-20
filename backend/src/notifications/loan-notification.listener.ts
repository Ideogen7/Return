import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationType, LoanStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service.js';
import { LOAN_EVENTS } from '../common/events/loan.events.js';
import type { LoanCreatedEvent, LoanStatusChangedEvent } from '../common/events/loan.events.js';

@Injectable()
export class LoanNotificationListener {
  private readonly logger = new Logger(LoanNotificationListener.name);

  constructor(private readonly prisma: PrismaService) {}

  @OnEvent(LOAN_EVENTS.CREATED)
  async handleLoanCreated(event: LoanCreatedEvent): Promise<void> {
    try {
      this.logger.debug(`Loan created: ${event.loanId}, notifying borrower`);

      const borrower = await this.prisma.borrower.findUnique({
        where: { id: event.borrowerId },
        select: { userId: true },
      });

      if (!borrower?.userId) {
        this.logger.debug(`Borrower ${event.borrowerId} has no userId, skipping notification`);
        return;
      }

      await this.prisma.notification.create({
        data: {
          userId: borrower.userId,
          type: NotificationType.LOAN_CREATED,
          title: 'Nouveau prêt',
          body: 'Un nouveau prêt a été enregistré pour vous.',
          relatedLoanId: event.loanId,
        },
      });

      this.logger.log(
        `LOAN_CREATED notification sent to user ${borrower.userId} for loan ${event.loanId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send LOAN_CREATED notification for loan ${event.loanId}: ${String(error)}`,
      );
    }
  }

  @OnEvent(LOAN_EVENTS.STATUS_CHANGED)
  async handleStatusChanged(event: LoanStatusChangedEvent): Promise<void> {
    try {
      this.logger.debug(`Loan ${event.loanId}: ${event.previousStatus} → ${event.newStatus}`);

      switch (event.newStatus) {
        case LoanStatus.ACTIVE:
          await this.notifyLender(event, NotificationType.LOAN_CONFIRMED, {
            title: 'Prêt confirmé',
            body: "L'emprunteur a confirmé le prêt.",
          });
          break;

        case LoanStatus.ACTIVE_BY_DEFAULT:
          await this.notifyBoth(event, NotificationType.LOAN_AUTO_CONFIRMED, {
            title: 'Prêt confirmé automatiquement',
            body: 'Le prêt a été confirmé automatiquement après 48h sans réponse.',
          });
          break;

        case LoanStatus.CONTESTED:
          await this.notifyLender(event, NotificationType.LOAN_CONTESTED, {
            title: 'Prêt contesté',
            body: "L'emprunteur a contesté le prêt.",
          });
          break;

        case LoanStatus.RETURNED:
          await this.notifyBorrower(event, NotificationType.LOAN_RETURNED, {
            title: 'Objet rendu',
            body: 'Le prêteur a confirmé le retour de votre objet.',
          });
          break;

        default:
          this.logger.debug(`No notification for status transition to ${event.newStatus}`);
          break;
      }
    } catch (error) {
      this.logger.error(
        `Failed to send notification for loan ${event.loanId} status ${event.newStatus}: ${String(error)}`,
      );
    }
  }

  private async notifyLender(
    event: LoanStatusChangedEvent,
    type: NotificationType,
    message: { title: string; body: string },
  ): Promise<void> {
    await this.prisma.notification.create({
      data: {
        userId: event.lenderUserId,
        type,
        title: message.title,
        body: message.body,
        relatedLoanId: event.loanId,
      },
    });

    this.logger.log(
      `${type} notification sent to lender ${event.lenderUserId} for loan ${event.loanId}`,
    );
  }

  private async notifyBorrower(
    event: LoanStatusChangedEvent,
    type: NotificationType,
    message: { title: string; body: string },
  ): Promise<void> {
    const borrower = await this.prisma.borrower.findUnique({
      where: { id: event.borrowerId },
      select: { userId: true },
    });

    if (!borrower?.userId) {
      this.logger.debug(
        `Borrower ${event.borrowerId} has no userId, skipping ${type} notification`,
      );
      return;
    }

    await this.prisma.notification.create({
      data: {
        userId: borrower.userId,
        type,
        title: message.title,
        body: message.body,
        relatedLoanId: event.loanId,
      },
    });

    this.logger.log(
      `${type} notification sent to borrower ${borrower.userId} for loan ${event.loanId}`,
    );
  }

  private async notifyBoth(
    event: LoanStatusChangedEvent,
    type: NotificationType,
    message: { title: string; body: string },
  ): Promise<void> {
    await this.notifyLender(event, type, message);
    await this.notifyBorrower(event, type, message);
  }
}
