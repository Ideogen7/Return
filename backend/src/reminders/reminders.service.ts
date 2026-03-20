import { Injectable, Logger } from '@nestjs/common';
import { ReminderStatus, type Reminder } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service.js';
import { ReminderPolicy } from './reminder-policy.js';

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

  /**
   * Returns all reminders for a given loan, ordered by scheduledFor ASC.
   */
  async findByLoanId(loanId: string): Promise<Reminder[]> {
    return this.prisma.reminder.findMany({
      where: { loanId },
      orderBy: { scheduledFor: 'asc' },
    });
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
}
