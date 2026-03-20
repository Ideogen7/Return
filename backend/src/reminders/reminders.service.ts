import { Injectable, Logger } from '@nestjs/common';
import { ReminderStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service.js';
import { ReminderPolicy } from './reminder-policy.js';

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
}
