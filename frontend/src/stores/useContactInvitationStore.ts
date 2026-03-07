import { create } from 'zustand';
import apiClient from '../api/apiClient';
import { extractProblemDetails } from '../utils/error';
import { useBorrowerStore } from './useBorrowerStore';
import type {
  ContactInvitation,
  UserSearchResult,
  PaginatedResponse,
  ProblemDetails,
} from '../types/api.types';

interface ContactInvitationState {
  receivedInvitations: ContactInvitation[];
  sentInvitations: ContactInvitation[];
  searchResults: UserSearchResult[];
  pendingCount: number;
  isLoading: boolean;
  isSearching: boolean;
  error: ProblemDetails | null;

  searchUsers: (query: string, page?: number, limit?: number) => Promise<void>;
  fetchReceivedInvitations: () => Promise<void>;
  fetchSentInvitations: () => Promise<void>;
  sendInvitation: (recipientEmail: string) => Promise<ContactInvitation>;
  acceptInvitation: (id: string) => Promise<void>;
  rejectInvitation: (id: string) => Promise<void>;
  cancelInvitation: (id: string) => Promise<void>;
  reset: () => void;
}

const initialState = {
  receivedInvitations: [],
  sentInvitations: [],
  searchResults: [],
  pendingCount: 0,
  isLoading: false,
  isSearching: false,
  error: null,
};

export const useContactInvitationStore = create<ContactInvitationState>((set, get) => ({
  ...initialState,

  searchUsers: async (query, page = 1, limit = 20) => {
    set({ isSearching: true, error: null });
    try {
      const { data } = await apiClient.post<PaginatedResponse<UserSearchResult>>(
        '/contact-invitations/search',
        { query, page, limit },
      );
      set({ searchResults: data.data, isSearching: false });
    } catch (err) {
      set({ isSearching: false, error: extractProblemDetails(err) });
      throw err;
    }
  },

  fetchReceivedInvitations: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await apiClient.get<PaginatedResponse<ContactInvitation>>(
        '/contact-invitations',
        { params: { direction: 'received', status: 'PENDING' } },
      );
      const received = data.data;
      set({
        receivedInvitations: received,
        pendingCount: received.filter((i) => i.status === 'PENDING').length,
        isLoading: false,
      });
    } catch (err) {
      set({ isLoading: false, error: extractProblemDetails(err) });
      throw err;
    }
  },

  fetchSentInvitations: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await apiClient.get<PaginatedResponse<ContactInvitation>>(
        '/contact-invitations',
        { params: { direction: 'sent' } },
      );
      set({ sentInvitations: data.data, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: extractProblemDetails(err) });
      throw err;
    }
  },

  sendInvitation: async (recipientEmail) => {
    set({ isLoading: true, error: null });
    try {
      const { data: invitation } = await apiClient.post<ContactInvitation>(
        '/contact-invitations',
        { recipientEmail },
      );
      // Optimistic update of search results
      set((state) => ({
        searchResults: state.searchResults.map((r) =>
          r.email === recipientEmail
            ? { ...r, pendingInvitation: true, pendingInvitationId: invitation.id }
            : r,
        ),
        isLoading: false,
      }));
      return invitation;
    } catch (err) {
      set({ isLoading: false, error: extractProblemDetails(err) });
      throw err;
    }
  },

  acceptInvitation: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.post(`/contact-invitations/${id}/accept`);
      set((state) => {
        const updated = state.receivedInvitations.filter((i) => i.id !== id);
        return {
          receivedInvitations: updated,
          pendingCount: updated.filter((i) => i.status === 'PENDING').length,
          isLoading: false,
        };
      });
      // Refresh borrowers list after accepting
      useBorrowerStore.getState().fetchBorrowers().catch(() => {});
    } catch (err) {
      set({ isLoading: false, error: extractProblemDetails(err) });
      throw err;
    }
  },

  rejectInvitation: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.post(`/contact-invitations/${id}/reject`);
      set((state) => {
        const updated = state.receivedInvitations.filter((i) => i.id !== id);
        return {
          receivedInvitations: updated,
          pendingCount: updated.filter((i) => i.status === 'PENDING').length,
          isLoading: false,
        };
      });
    } catch (err) {
      set({ isLoading: false, error: extractProblemDetails(err) });
      throw err;
    }
  },

  cancelInvitation: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.delete(`/contact-invitations/${id}`);
      // Optimistic update of search results
      set((state) => ({
        searchResults: state.searchResults.map((r) =>
          r.pendingInvitationId === id
            ? { ...r, pendingInvitation: false, pendingInvitationId: null }
            : r,
        ),
        sentInvitations: state.sentInvitations.filter((i) => i.id !== id),
        isLoading: false,
      }));
    } catch (err) {
      set({ isLoading: false, error: extractProblemDetails(err) });
      throw err;
    }
  },

  reset: () => set({ ...initialState }),
}));
