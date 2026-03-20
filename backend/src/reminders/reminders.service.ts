import { Injectable, Logger } from '@nestjs/common';
import { ReminderStatus, type Reminder } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service.js';
import {
  ForbiddenException,
  NotFoundException,
} from '../common/exceptions/problem-details.exception.js';
import { ReminderPolicy } from './reminder-policy.js';
import type { ReminderResponse } from './interfaces/reminder-response.interface.js';

/** Reminder with its loan relation (includes lenderId for ownership checks) */
export type ReminderWithLoan = Reminder & {
  loan: { id: string; lenderId: string };
};

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async scheduleReminders(loanId: string, returnDate: Date | null, createdAt: Date): Promise<void> {
    const schedules = ReminderPolicy.calculateDates(returnDate, createdAt);
    if (schedules.length === 0) return;

    await this.prisma.reminder.createMany({
      data: schedules.map((schedule) => ({
        loanId,
        type: schedule.type,
        status: ReminderStatus.SCHEDULED,
        scheduledFor: schedule.scheduledFor,
      })),
    });

    this.logger.log(`Scheduled ${schedules.length} reminders for loan ${loanId}`);
  }

  // ===========================================================================
  // Loan lookup & ownership
  // ===========================================================================

  /**
   * Finds a loan by ID for reminder access. Throws 404 if the loan
   * does not exist or has been soft-deleted.
   */
  async findLoanForReminders(
    loanId: string,
    path: string,
  ): Promise<{ id: string; lenderId: string }> {
    const loan = await this.prisma.loan.findUnique({
      where: { id: loanId },
      select: { id: true, lenderId: true, deletedAt: true },
    });

    if (!loan || loan.deletedAt !== null) {
      throw new NotFoundException('Loan', loanId, path);
    }

    return loan;
  }

  /**
   * Asserts the current user is the lender of the loan.
   * Throws 403 if the userId does not match.
   */
  assertLoanOwnership(loan: { lenderId: string }, userId: string, path: string): void {
    if (loan.lenderId !== userId) {
      throw new ForbiddenException(
        'forbidden',
        'Forbidden',
        'Only the lender can access reminders for this loan.',
        path,
      );
    }
  }

  // ===========================================================================
  // CRUD
  // ===========================================================================

  /**
   * Returns all reminders for a given loan, ordered by scheduledFor ASC,
   * already mapped to the API response shape.
   */
  async findByLoanId(loanId: string): Promise<ReminderResponse[]> {
    const reminders = await this.prisma.reminder.findMany({
      where: { loanId },
      orderBy: { scheduledFor: 'asc' },
    });
    return reminders.map((r) => this.toReminderResponse(r));
  }

  /**
   * Returns a single reminder by ID, including its loan relation.
   * Returns null if not found.
   */
  async findById(reminderId: string): Promise<ReminderWithLoan | null> {
    const reminder = await this.prisma.reminder.findUnique({
      where: { id: reminderId },
      include: { loan: { select: { id: true, lenderId: true } } },
    });
    return reminder as ReminderWithLoan | null;
  }

  /**
   * Cancels a scheduled reminder by setting its status to CANCELLED.
   */
  async cancel(reminderId: string): Promise<void> {
    await this.prisma.reminder.update({
      where: { id: reminderId },
      data: { status: ReminderStatus.CANCELLED },
    });
  }

  // ===========================================================================
  // Mapping
  // ===========================================================================

  /**
   * Maps a Prisma Reminder to the API response DTO.
   */
  toReminderResponse(reminder: Reminder): ReminderResponse {
    return {
      id: reminder.id,
      loanId: reminder.loanId,
      type: reminder.type,
      status: reminder.status,
      scheduledFor: reminder.scheduledFor.toISOString(),
      sentAt: reminder.sentAt?.toISOString() ?? null,
      message: reminder.message ?? undefined,
      channel: reminder.channel,
    };
  }
}
