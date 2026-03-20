import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { LOAN_EVENTS } from '../common/events/loan.events.js';
import type { LoanCreatedEvent } from '../common/events/loan.events.js';
import { RemindersService } from './reminders.service.js';

@Injectable()
export class ReminderListener {
  private readonly logger = new Logger(ReminderListener.name);

  constructor(private readonly remindersService: RemindersService) {}

  @OnEvent(LOAN_EVENTS.CREATED)
  async handleLoanCreated(event: LoanCreatedEvent): Promise<void> {
    this.logger.debug(`Scheduling reminders for loan ${event.loanId}`);

    await this.remindersService.scheduleReminders(event.loanId, event.returnDate, event.createdAt);
  }
}
