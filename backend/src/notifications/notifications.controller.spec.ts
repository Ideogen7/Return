import { Test, TestingModule } from '@nestjs/testing';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { NotificationType } from '@prisma/client';

import { NotificationsController } from './notifications.controller.js';
import { NotificationsService } from './notifications.service.js';
import { DeviceTokensService } from './device-tokens.service.js';
import type { PaginatedNotifications } from './notifications.service.js';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy.js';

// =============================================================================
// Fixtures
// =============================================================================

const USER_ID = '11111111-1111-1111-1111-111111111111';
const NOTIFICATION_ID = 'notif-1111-1111-1111-111111111111';
const LOAN_ID = '22222222-2222-2222-2222-222222222222';

const MOCK_AUTH_USER: AuthenticatedUser = {
  userId: USER_ID,
  email: 'user@example.com',
  role: 'LENDER',
  jti: 'jti-123',
  tokenExp: Math.floor(Date.now() / 1000) + 900,
};

const MOCK_PAGINATED: PaginatedNotifications = {
  data: [
    {
      id: NOTIFICATION_ID,
      type: NotificationType.LOAN_CREATED,
      title: 'Nouveau prêt',
      body: 'Un prêt a été créé.',
      isRead: false,
      relatedLoanId: LOAN_ID,
      createdAt: new Date('2026-03-15T10:00:00Z'),
    },
  ],
  pagination: {
    currentPage: 1,
    itemsPerPage: 20,
    totalItems: 1,
    totalPages: 1,
  },
};

// =============================================================================
// Test Suite — REM-014 to REM-022
// =============================================================================

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let notificationsService: DeepMockProxy<NotificationsService>;
  let deviceTokensService: DeepMockProxy<DeviceTokensService>;

  beforeEach(async () => {
    notificationsService = mockDeep<NotificationsService>();
    deviceTokensService = mockDeep<DeviceTokensService>();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        { provide: NotificationsService, useValue: notificationsService },
        { provide: DeviceTokensService, useValue: deviceTokensService },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
  });

  // ===========================================================================
  // GET /v1/notifications
  // ===========================================================================

  describe('GET /notifications', () => {
    it('should return paginated notifications', async () => {
      notificationsService.findAllByUser.mockResolvedValue(MOCK_PAGINATED);

      const req = { user: MOCK_AUTH_USER } as unknown as Express.Request;
      const result = await controller.listNotifications(req, {
        page: 1,
        limit: 20,
        unreadOnly: false,
      });

      expect(result).toEqual(MOCK_PAGINATED);
      expect(notificationsService.findAllByUser).toHaveBeenCalledWith(USER_ID, {
        page: 1,
        limit: 20,
        unreadOnly: false,
      });
    });

    it('should pass unreadOnly filter', async () => {
      notificationsService.findAllByUser.mockResolvedValue({
        data: [],
        pagination: { currentPage: 1, itemsPerPage: 20, totalItems: 0, totalPages: 0 },
      });

      const req = { user: MOCK_AUTH_USER } as unknown as Express.Request;
      await controller.listNotifications(req, { page: 1, limit: 20, unreadOnly: true });

      expect(notificationsService.findAllByUser).toHaveBeenCalledWith(USER_ID, {
        page: 1,
        limit: 20,
        unreadOnly: true,
      });
    });
  });

  // ===========================================================================
  // PATCH /v1/notifications/:notificationId/read
  // ===========================================================================

  describe('PATCH /notifications/:notificationId/read', () => {
    it('should mark notification as read', async () => {
      notificationsService.markAsRead.mockResolvedValue(undefined);

      const req = { user: MOCK_AUTH_USER } as unknown as Express.Request;
      await controller.markAsRead(req, NOTIFICATION_ID);

      expect(notificationsService.markAsRead).toHaveBeenCalledWith(NOTIFICATION_ID, USER_ID);
    });
  });

  // ===========================================================================
  // POST /v1/notifications/read-all
  // ===========================================================================

  describe('POST /notifications/read-all', () => {
    it('should mark all notifications as read', async () => {
      notificationsService.markAllAsRead.mockResolvedValue(undefined);

      const req = { user: MOCK_AUTH_USER } as unknown as Express.Request;
      await controller.markAllAsRead(req);

      expect(notificationsService.markAllAsRead).toHaveBeenCalledWith(USER_ID);
    });
  });

  // ===========================================================================
  // POST /v1/notifications/device-token
  // ===========================================================================

  describe('POST /notifications/device-token', () => {
    it('should register device token', async () => {
      deviceTokensService.registerToken.mockResolvedValue(undefined);

      const req = { user: MOCK_AUTH_USER } as unknown as Express.Request;
      await controller.registerDeviceToken(req, {
        token: 'fcm-token',
        platform: 'android' as never,
      });

      expect(deviceTokensService.registerToken).toHaveBeenCalledWith(
        USER_ID,
        'fcm-token',
        'android',
      );
    });
  });

  // ===========================================================================
  // DELETE /v1/notifications/device-token
  // ===========================================================================

  describe('DELETE /notifications/device-token', () => {
    it('should unregister device token', async () => {
      deviceTokensService.unregisterToken.mockResolvedValue(undefined);

      const req = { user: MOCK_AUTH_USER } as unknown as Express.Request;
      await controller.unregisterDeviceToken(req, { token: 'fcm-token' });

      expect(deviceTokensService.unregisterToken).toHaveBeenCalledWith(USER_ID, 'fcm-token');
    });
  });
});
