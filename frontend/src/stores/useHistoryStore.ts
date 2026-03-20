import { create } from 'zustand';
import apiClient from '../api/apiClient';
import { extractProblemDetails } from '../utils/error';
import type {
  Loan,
  LoanStatus,
  HistoryStatistics,
  PaginationMetadata,
  PaginatedResponse,
  ProblemDetails,
} from '../types/api.types';

interface HistoryState {
  archivedLoans: Loan[];
  statistics: HistoryStatistics | null;
  pagination: PaginationMetadata | null;
  isLoading: boolean;
  error: ProblemDetails | null;

  fetchArchivedLoans: (options?: {
    status?: LoanStatus[];
    borrowerId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => Promise<void>;
  fetchStatistics: () => Promise<void>;
  reset: () => void;
}

const initialState = {
  archivedLoans: [] as Loan[],
  statistics: null as HistoryStatistics | null,
  pagination: null as PaginationMetadata | null,
  isLoading: false,
  error: null as ProblemDetails | null,
};

export const useHistoryStore = create<HistoryState>((set) => ({
  ...initialState,

  fetchArchivedLoans: async (options) => {
    set({ isLoading: true, error: null });
    try {
      const params: Record<string, unknown> = {};
      if (options?.status) params.status = options.status.join(',');
      if (options?.borrowerId) params.borrowerId = options.borrowerId;
      if (options?.startDate) params.startDate = options.startDate;
      if (options?.endDate) params.endDate = options.endDate;
      if (options?.page) params.page = options.page;
      if (options?.limit) params.limit = options.limit;

      const { data } = await apiClient.get<PaginatedResponse<Loan>>('/history/loans', {
        params,
      });
      set({
        archivedLoans: data.data,
        pagination: data.pagination,
        isLoading: false,
      });
    } catch (err) {
      set({ isLoading: false, error: extractProblemDetails(err) });
      throw err;
    }
  },

  fetchStatistics: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await apiClient.get<HistoryStatistics>('/history/statistics');
      set({ statistics: data, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: extractProblemDetails(err) });
      throw err;
    }
  },

  reset: () => set({ ...initialState }),
}));
