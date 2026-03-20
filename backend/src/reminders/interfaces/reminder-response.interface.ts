import type { ReminderType, ReminderStatus, NotificationChannel } from '@prisma/client';

export interface ReminderResponse {
  id: string;
  loanId: string;
  type: ReminderType;
  status: ReminderStatus;
  scheduledFor: string;
  sentAt: string | null;
  message: string | null;
  channel: NotificationChannel;
}
