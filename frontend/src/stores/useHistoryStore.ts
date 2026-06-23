import { create } from 'zustand';
import apiClient from '../api/apiClient';
import { extractProblemDetails } from '../utils/error';
import type { HistoryStatistics, ProblemDetails } from '../types/api.types';

interface HistoryState {
  statistics: HistoryStatistics | null;
  isLoading: boolean;
  error: ProblemDetails | null;

  fetchStatistics: () => Promise<void>;
  reset: () => void;
}

const initialState = {
  statistics: null as HistoryStatistics | null,
  isLoading: false,
  error: null as ProblemDetails | null,
};

export const useHistoryStore = create<HistoryState>((set) => ({
  ...initialState,

  fetchStatistics: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await apiClient.get<HistoryStatistics>('/history/statistics');
      set({ statistics: data, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: extractProblemDetails(err) });
      // Silent fail — stats are non-critical; component falls back to zeros
    }
  },

  reset: () => set({ ...initialState }),
}));
