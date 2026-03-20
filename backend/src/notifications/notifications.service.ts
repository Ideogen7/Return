import { Injectable, Logger } from '@nestjs/common';
import { NotificationType, type ReminderType } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service.js';
import {
  NotFoundException,
  ForbiddenException,
} from '../common/exceptions/problem-details.exception.js';

const REMINDER_TITLES: Record<string, string> = {
  PREVENTIVE: 'Rappel préventif',
  ON_DUE_DATE: 'Rappel jour J',
  FIRST_OVERDUE: 'Premier rappel de retard',
  SECOND_OVERDUE: 'Deuxième rappel de retard',
  FINAL_OVERDUE: 'Dernier rappel avant clôture',
};

export interface PaginatedNotifications {
  data: Array<{
    id: string;
    type: NotificationType;
    title: string;
    body: string;
    isRead: boolean;
    relatedLoanId: string | null;
    createdAt: Date;
  }>;
  pagination: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface FindAllOptions {
  page: number;
  limit: number;
  unreadOnly: boolean;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async sendReminderNotification(
    reminderId: string,
    loanId: string,
    lenderUserId: string,
    reminderType: ReminderType,
  ): Promise<void> {
    const title = REMINDER_TITLES[reminderType] ?? 'Rappel de prêt';

    await this.prisma.notification.create({
      data: {
        userId: lenderUserId,
        type: NotificationType.REMINDER_SENT,
        title,
        body: `Un rappel de type ${reminderType} a été envoyé pour votre prêt.`,
        relatedLoanId: loanId,
      },
    });

    this.logger.log(`Sent ${reminderType} notification for reminder ${reminderId}, loan ${loanId}`);
  }

  async findAllByUser(userId: string, options: FindAllOptions): Promise<PaginatedNotifications> {
    const { page, limit, unreadOnly } = options;
    const skip = (page - 1) * limit;

    const where: { userId: string; isRead?: boolean } = { userId };
    if (unreadOnly) {
      where.isRead = false;
    }

    const [data, totalItems] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      data: data.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        isRead: n.isRead,
        relatedLoanId: n.relatedLoanId,
        createdAt: n.createdAt,
      })),
      pagination: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException(
        'Notification',
        notificationId,
        `/v1/notifications/${notificationId}/read`,
      );
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException(
        'notification-access-forbidden',
        'Access forbidden',
        'You do not have permission to access this notification.',
        `/v1/notifications/${notificationId}/read`,
      );
    }

    await this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}
