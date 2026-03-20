import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { RemindersService } from './reminders.service.js';
import { ReminderListener } from './reminder.listener.js';
import { RemindersCronService } from './reminders-cron.service.js';

@Module({
  imports: [PrismaModule, NotificationsModule],
  providers: [RemindersService, ReminderListener, RemindersCronService],
  exports: [RemindersService],
})
export class RemindersModule {}
