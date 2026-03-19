import { create } from 'zustand';
import apiClient from '../api/apiClient';
import { extractProblemDetails } from '../utils/error';
import type { Notification, PaginatedResponse, ProblemDetails } from '../types/api.types';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: ProblemDetails | null;

  fetchNotifications: (options?: {
    unreadOnly?: boolean;
    page?: number;
    limit?: number;
  }) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  registerDeviceToken: (token: string, platform: 'ios' | 'android' | 'web') => Promise<void>;
  unregisterDeviceToken: (token: string) => Promise<void>;
  reset: () => void;
}

const initialState = {
  notifications: [] as Notification[],
  unreadCount: 0,
  isLoading: false,
  error: null as ProblemDetails | null,
};

export const useNotificationStore = create<NotificationState>((set) => ({
  ...initialState,

  fetchNotifications: async (options) => {
    set({ isLoading: true, error: null });
    try {
      const params: Record<string, unknown> = {};
      if (options?.unreadOnly) params.unreadOnly = true;
      if (options?.page) params.page = options.page;
      if (options?.limit) params.limit = options.limit;

      const { data } = await apiClient.get<PaginatedResponse<Notification>>('/notifications', {
        params,
      });
      const notifications = data.data;
      set({
        notifications,
        unreadCount: notifications.filter((n) => !n.isRead).length,
        isLoading: false,
      });
    } catch (err) {
      set({ isLoading: false, error: extractProblemDetails(err) });
      throw err;
    }
  },

  markAsRead: async (id) => {
    // Optimistic update
    set((state) => {
      const updated = state.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n));
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.isRead).length,
      };
    });
    try {
      await apiClient.patch(`/notifications/${id}/read`);
    } catch (err) {
      // Revert on failure
      set((state) => {
        const reverted = state.notifications.map((n) =>
          n.id === id ? { ...n, isRead: false } : n,
        );
        return {
          notifications: reverted,
          unreadCount: reverted.filter((n) => !n.isRead).length,
          error: extractProblemDetails(err),
        };
      });
      throw err;
    }
  },

  markAllAsRead: async () => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.post('/notifications/read-all');
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
        isLoading: false,
      }));
    } catch (err) {
      set({ isLoading: false, error: extractProblemDetails(err) });
      throw err;
    }
  },

  registerDeviceToken: async (token, platform) => {
    try {
      await apiClient.post('/notifications/device-token', { token, platform });
    } catch (err) {
      set({ error: extractProblemDetails(err) });
      throw err;
    }
  },

  unregisterDeviceToken: async (token) => {
    try {
      await apiClient.delete('/notifications/device-token', { data: { token } });
    } catch (err) {
      set({ error: extractProblemDetails(err) });
      throw err;
    }
  },

  reset: () => set({ ...initialState }),
}));
