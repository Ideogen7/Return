import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { RedisModule } from '../redis/redis.module.js';
import { ContactInvitationsModule } from '../contact-invitations/contact-invitations.module.js';
import { LoansService } from './loans.service.js';
import { LoansCronService } from './loans-cron.service.js';
import { ReminderExhaustedListener } from './reminder-exhausted.listener.js';
import { LoansController } from './loans.controller.js';

@Module({
  imports: [PrismaModule, RedisModule, ContactInvitationsModule],
  controllers: [LoansController],
  providers: [LoansService, LoansCronService, ReminderExhaustedListener],
  exports: [LoansService],
})
export class LoansModule {}
