import { create } from 'zustand';
import apiClient from '../api/apiClient';
import { extractProblemDetails } from '../utils/error';
import type {
  Borrower,
  BorrowerStatistics,
  CreateBorrowerDto,
  UpdateBorrowerDto,
  PaginatedResponse,
  ProblemDetails,
} from '../types/api.types';

interface BorrowerState {
  borrowers: Borrower[];
  selectedBorrower: Borrower | null;
  selectedBorrowerStats: BorrowerStatistics | null;
  isLoading: boolean;
  error: ProblemDetails | null;

  fetchBorrowers: (page?: number) => Promise<void>;
  fetchBorrower: (id: string) => Promise<void>;
  fetchBorrowerStats: (id: string) => Promise<void>;
  createBorrower: (data: CreateBorrowerDto) => Promise<Borrower>;
  updateBorrower: (id: string, data: UpdateBorrowerDto) => Promise<Borrower>;
  deleteBorrower: (id: string) => Promise<void>;
  reset: () => void;
}

const initialState = {
  borrowers: [],
  selectedBorrower: null,
  selectedBorrowerStats: null,
  isLoading: false,
  error: null,
};

export const useBorrowerStore = create<BorrowerState>((set) => ({
  ...initialState,

  fetchBorrowers: async (page = 1) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await apiClient.get<PaginatedResponse<Borrower>>('/borrowers', {
        params: { page, limit: 20, sortBy: 'firstName', sortOrder: 'asc' },
      });
      set({ borrowers: data.data, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: extractProblemDetails(err) });
      throw err;
    }
  },

  fetchBorrower: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await apiClient.get<Borrower>(`/borrowers/${id}`);
      set({ selectedBorrower: data, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: extractProblemDetails(err) });
      throw err;
    }
  },

  fetchBorrowerStats: async (id) => {
    set({ selectedBorrowerStats: null });
    try {
      const { data } = await apiClient.get<BorrowerStatistics>(`/borrowers/${id}/statistics`);
      set({ selectedBorrowerStats: data });
    } catch (err) {
      set({ error: extractProblemDetails(err) });
      throw err;
    }
  },

  createBorrower: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const { data: newBorrower } = await apiClient.post<Borrower>('/borrowers', data);
      set((state) => ({
        borrowers: [...state.borrowers, newBorrower],
        isLoading: false,
      }));
      return newBorrower;
    } catch (err) {
      set({ isLoading: false, error: extractProblemDetails(err) });
      throw err;
    }
  },

  updateBorrower: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const { data: updated } = await apiClient.patch<Borrower>(`/borrowers/${id}`, data);
      set((state) => ({
        borrowers: state.borrowers.map((b) => (b.id === id ? updated : b)),
        selectedBorrower: state.selectedBorrower?.id === id ? updated : state.selectedBorrower,
        isLoading: false,
      }));
      return updated;
    } catch (err) {
      set({ isLoading: false, error: extractProblemDetails(err) });
      throw err;
    }
  },

  deleteBorrower: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.delete(`/borrowers/${id}`);
      set((state) => ({
        borrowers: state.borrowers.filter((b) => b.id !== id),
        selectedBorrower: state.selectedBorrower?.id === id ? null : state.selectedBorrower,
        isLoading: false,
      }));
    } catch (err) {
      set({ isLoading: false, error: extractProblemDetails(err) });
      throw err;
    }
  },

  reset: () => set({ ...initialState }),
}));
