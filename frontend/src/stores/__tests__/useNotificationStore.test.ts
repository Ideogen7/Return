// Force all requests to go through MSW (bypass Prism mock server)
jest.mock('../../config/api-modules.config', () => ({
  getBaseUrl: () => 'http://localhost:3000/v1',
}));

import { http, HttpResponse } from 'msw';
import { server } from '../../../__mocks__/server';
import { useNotificationStore } from '../useNotificationStore';

const API_BASE = 'http://localhost:3000/v1';

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  useNotificationStore.getState().reset();
});
afterAll(() => server.close());

describe('useNotificationStore', () => {
  describe('fetchNotifications', () => {
    it('should fetch all notifications and compute unreadCount', async () => {
      await useNotificationStore.getState().fetchNotifications();

      const state = useNotificationStore.getState();
      expect(state.notifications).toHaveLength(2);
      expect(state.unreadCount).toBe(1);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should fetch unread-only notifications', async () => {
      await useNotificationStore.getState().fetchNotifications({ unreadOnly: true });

      const state = useNotificationStore.getState();
      expect(state.notifications).toHaveLength(1);
      expect(state.notifications[0]!.isRead).toBe(false);
      expect(state.unreadCount).toBe(1);
    });
  });

  describe('markAsRead', () => {
    it('should optimistically mark a notification as read', async () => {
      await useNotificationStore.getState().fetchNotifications();
      expect(useNotificationStore.getState().unreadCount).toBe(1);

      await useNotificationStore.getState().markAsRead('notif-unread-1234');

      const state = useNotificationStore.getState();
      const notif = state.notifications.find((n) => n.id === 'notif-unread-1234');
      expect(notif?.isRead).toBe(true);
      expect(state.unreadCount).toBe(0);
    });

    it('should revert on API failure', async () => {
      await useNotificationStore.getState().fetchNotifications();

      server.use(
        http.patch(`${API_BASE}/notifications/:id/read`, () => {
          return HttpResponse.json(
            {
              type: 'https://api.return.app/errors/internal-server-error',
              title: 'Internal Server Error',
              status: 500,
              detail: 'An unexpected error occurred',
              instance: '/notifications/notif-unread-1234/read',
              timestamp: '2026-03-18T10:00:00Z',
              requestId: 'req-mock',
            },
            { status: 500 },
          );
        }),
      );

      await expect(
        useNotificationStore.getState().markAsRead('notif-unread-1234'),
      ).rejects.toThrow();

      const state = useNotificationStore.getState();
      const notif = state.notifications.find((n) => n.id === 'notif-unread-1234');
      expect(notif?.isRead).toBe(false);
      expect(state.unreadCount).toBe(1);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      await useNotificationStore.getState().fetchNotifications();
      await useNotificationStore.getState().markAllAsRead();

      const state = useNotificationStore.getState();
      expect(state.unreadCount).toBe(0);
      expect(state.notifications.every((n) => n.isRead)).toBe(true);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('registerDeviceToken', () => {
    it('should register device token without error', async () => {
      await expect(
        useNotificationStore.getState().registerDeviceToken('expo-token-123', 'android'),
      ).resolves.not.toThrow();
    });
  });

  describe('unregisterDeviceToken', () => {
    it('should unregister device token without error', async () => {
      await expect(
        useNotificationStore.getState().unregisterDeviceToken('expo-token-123'),
      ).resolves.not.toThrow();
    });
  });

  describe('reset', () => {
    it('should reset to initial state', async () => {
      await useNotificationStore.getState().fetchNotifications();
      expect(useNotificationStore.getState().notifications.length).toBeGreaterThan(0);

      useNotificationStore.getState().reset();

      const state = useNotificationStore.getState();
      expect(state.notifications).toHaveLength(0);
      expect(state.unreadCount).toBe(0);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('error handling', () => {
    it('should set error state on fetchNotifications failure', async () => {
      server.use(
        http.get(`${API_BASE}/notifications`, () => {
          return HttpResponse.json(
            {
              type: 'https://api.return.app/errors/internal-server-error',
              title: 'Internal Server Error',
              status: 500,
              detail: 'An unexpected error occurred',
              instance: '/notifications',
              timestamp: '2026-03-18T10:00:00Z',
              requestId: 'req-mock',
            },
            { status: 500 },
          );
        }),
      );

      await expect(useNotificationStore.getState().fetchNotifications()).rejects.toThrow();

      const state = useNotificationStore.getState();
      expect(state.notifications).toHaveLength(0);
      expect(state.error).not.toBeNull();
      expect(state.error?.status).toBe(500);
      expect(state.isLoading).toBe(false);
    });
  });
});
