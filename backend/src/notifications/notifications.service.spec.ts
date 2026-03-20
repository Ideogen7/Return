import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { NotificationType, ReminderType } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service.js';
import { FirebaseService } from '../firebase/firebase.service.js';
import { NotificationsService } from './notifications.service.js';

// =============================================================================
// Fixtures
// =============================================================================

const REMINDER_ID = 'rem-11111111-1111-1111-1111-111111111111';
const LOAN_ID = '11111111-1111-1111-1111-111111111111';
const LENDER_USER_ID = '33333333-3333-3333-3333-333333333333';
const BORROWER_USER_ID = '44444444-4444-4444-4444-444444444444';
const NOTIFICATION_ID = 'notif-1111-1111-1111-111111111111';

// =============================================================================
// Test Suite — REM-011
// =============================================================================

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: DeepMockProxy<PrismaService>;
  let firebaseService: { isAvailable: jest.Mock; sendToMultipleTokens: jest.Mock };

  beforeEach(() => {
    prisma = mockDeep<PrismaService>();
    firebaseService = {
      isAvailable: jest.fn().mockReturnValue(false),
      sendToMultipleTokens: jest.fn().mockResolvedValue(undefined),
    };
    service = new NotificationsService(prisma, firebaseService as unknown as FirebaseService);
  });

  describe('sendReminderNotification', () => {
    it('should create a REMINDER_SENT notification for the lender', async () => {
      prisma.notification.create.mockResolvedValue({
        id: NOTIFICATION_ID,
        userId: LENDER_USER_ID,
        type: NotificationType.REMINDER_SENT,
        title: 'Rappel de prêt',
        body: expect.any(String),
        isRead: false,
        relatedLoanId: LOAN_ID,
        createdAt: expect.any(Date),
      } as never);

      await service.sendReminderNotification(
        REMINDER_ID,
        LOAN_ID,
        LENDER_USER_ID,
        ReminderType.ON_DUE_DATE,
      );

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: LENDER_USER_ID,
          type: NotificationType.REMINDER_SENT,
          title: expect.any(String),
          body: expect.any(String),
          relatedLoanId: LOAN_ID,
        },
      });
    });

    it('should also create a REMINDER_RECEIVED notification for the borrower when borrowerUserId is provided', async () => {
      prisma.notification.create.mockResolvedValue({} as never);

      await service.sendReminderNotification(
        REMINDER_ID,
        LOAN_ID,
        LENDER_USER_ID,
        ReminderType.ON_DUE_DATE,
        BORROWER_USER_ID,
      );

      expect(prisma.notification.create).toHaveBeenCalledTimes(2);
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: BORROWER_USER_ID,
          type: NotificationType.REMINDER_RECEIVED,
          title: expect.any(String),
          body: expect.any(String),
          relatedLoanId: LOAN_ID,
        },
      });
    });

    it('should NOT create a borrower notification when borrowerUserId is null', async () => {
      prisma.notification.create.mockResolvedValue({} as never);

      await service.sendReminderNotification(
        REMINDER_ID,
        LOAN_ID,
        LENDER_USER_ID,
        ReminderType.ON_DUE_DATE,
        null,
      );

      expect(prisma.notification.create).toHaveBeenCalledTimes(1);
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ type: NotificationType.REMINDER_SENT }),
      });
    });
  });

  describe('findAllByUser', () => {
    it('should return paginated notifications for the user', async () => {
      const mockNotifications = [
        {
          id: NOTIFICATION_ID,
          userId: BORROWER_USER_ID,
          type: NotificationType.LOAN_CREATED,
          title: 'Nouveau prêt',
          body: 'Un prêt a été créé.',
          isRead: false,
          relatedLoanId: LOAN_ID,
          createdAt: new Date(),
        },
      ];

      prisma.notification.findMany.mockResolvedValue(mockNotifications as never);
      prisma.notification.count.mockResolvedValue(1);

      const result = await service.findAllByUser(BORROWER_USER_ID, {
        page: 1,
        limit: 20,
        unreadOnly: false,
      });

      expect(result.data).toHaveLength(1);
      expect(result.pagination.totalItems).toBe(1);
      expect(result.pagination.hasNextPage).toBe(false);
      expect(result.pagination.hasPreviousPage).toBe(false);
      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: BORROWER_USER_ID },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      });
    });

    it('should filter unread only when unreadOnly is true', async () => {
      prisma.notification.findMany.mockResolvedValue([]);
      prisma.notification.count.mockResolvedValue(0);

      await service.findAllByUser(BORROWER_USER_ID, {
        page: 1,
        limit: 20,
        unreadOnly: true,
      });

      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: BORROWER_USER_ID, isRead: false },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      });
    });
  });

  describe('markAsRead', () => {
    it('should update notification isRead to true', async () => {
      prisma.notification.findUnique.mockResolvedValue({
        id: NOTIFICATION_ID,
        userId: BORROWER_USER_ID,
        isRead: false,
      } as never);
      prisma.notification.update.mockResolvedValue({} as never);

      await service.markAsRead(NOTIFICATION_ID, BORROWER_USER_ID);

      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: NOTIFICATION_ID },
        data: { isRead: true },
      });
    });

    it('should throw NotFoundException when notification does not exist', async () => {
      prisma.notification.findUnique.mockResolvedValue(null);

      await expect(service.markAsRead(NOTIFICATION_ID, BORROWER_USER_ID)).rejects.toThrow(
        'Not Found',
      );
    });

    it('should throw ForbiddenException when notification belongs to another user', async () => {
      prisma.notification.findUnique.mockResolvedValue({
        id: NOTIFICATION_ID,
        userId: 'other-user-id',
        isRead: false,
      } as never);

      await expect(service.markAsRead(NOTIFICATION_ID, BORROWER_USER_ID)).rejects.toThrow(
        'Forbidden',
      );
    });
  });

  describe('markAllAsRead', () => {
    it('should update all unread notifications for the user', async () => {
      prisma.notification.updateMany.mockResolvedValue({ count: 5 });

      await service.markAllAsRead(BORROWER_USER_ID);

      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: BORROWER_USER_ID, isRead: false },
        data: { isRead: true },
      });
    });
  });
});
