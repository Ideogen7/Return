import { create } from 'zustand';
import apiClient from '../api/apiClient';
import {
  setAccessToken,
  setRefreshToken,
  getAccessToken,
  getRefreshToken,
  clearTokens,
} from '../utils/storage';
import { extractProblemDetails } from '../utils/error';
import type { User, AuthResponse, ProblemDetails } from '../types/api.types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: ProblemDetails | null;

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  hydrate: () => Promise<void>;
  reset: () => void;
}

const initialState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

export const useAuthStore = create<AuthState>((set) => ({
  ...initialState,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await apiClient.post<AuthResponse>('/auth/login', { email, password });
      await setAccessToken(data.accessToken);
      await setRefreshToken(data.refreshToken);
      set({
        user: data.user,
        accessToken: data.accessToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err) {
      set({ isLoading: false, error: extractProblemDetails(err) });
      throw err;
    }
  },

  register: async (email, password, firstName, lastName) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await apiClient.post<AuthResponse>('/auth/register', {
        email,
        password,
        firstName,
        lastName,
      });
      await setAccessToken(data.accessToken);
      await setRefreshToken(data.refreshToken);
      set({
        user: data.user,
        accessToken: data.accessToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err) {
      set({ isLoading: false, error: extractProblemDetails(err) });
      throw err;
    }
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // On déconnecte même si l'appel échoue (token expiré, réseau, etc.)
    }
    await clearTokens();
    set({ ...initialState });
  },

  refreshToken: async () => {
    const currentRefreshToken = await getRefreshToken();
    if (!currentRefreshToken) {
      await clearTokens();
      set({ ...initialState });
      return;
    }

    try {
      const { data } = await apiClient.post<AuthResponse>('/auth/refresh', {
        refreshToken: currentRefreshToken,
      });
      await setAccessToken(data.accessToken);
      await setRefreshToken(data.refreshToken);
      set({
        user: data.user,
        accessToken: data.accessToken,
        isAuthenticated: true,
      });
    } catch {
      await clearTokens();
      set({ ...initialState });
    }
  },

  hydrate: async () => {
    set({ isLoading: true });
    const token = await getAccessToken();
    if (!token) {
      set({ isLoading: false });
      return;
    }

    try {
      const { data: user } = await apiClient.get<User>('/users/me');
      set({
        user,
        accessToken: token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      await clearTokens();
      set({ ...initialState });
    }
  },

  reset: () => set({ ...initialState }),
}));
