// Force all requests to go through MSW (bypass Prism mock server)
jest.mock('../../config/api-modules.config', () => ({
  getBaseUrl: () => 'http://localhost:3000/v1',
}));

import { http, HttpResponse } from 'msw';
import { server } from '../../../__mocks__/server';
import { useHistoryStore } from '../useHistoryStore';

const API_BASE = 'http://localhost:3000/v1';

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  useHistoryStore.getState().reset();
});
afterAll(() => server.close());

describe('useHistoryStore', () => {
  describe('fetchArchivedLoans', () => {
    it('should fetch archived loans with pagination', async () => {
      await useHistoryStore.getState().fetchArchivedLoans();

      const state = useHistoryStore.getState();
      expect(state.archivedLoans).toHaveLength(1);
      expect(state.archivedLoans[0]!.id).toBe('archived-loan-1');
      expect(state.archivedLoans[0]!.status).toBe('RETURNED');
      expect(state.pagination).not.toBeNull();
      expect(state.pagination!.totalItems).toBe(1);
      expect(state.pagination!.currentPage).toBe(1);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle error', async () => {
      server.use(
        http.get(`${API_BASE}/history/loans`, () => {
          return HttpResponse.json(
            {
              type: 'https://api.return.app/errors/internal-server-error',
              title: 'Internal Server Error',
              status: 500,
              detail: 'An unexpected error occurred',
              instance: '/history/loans',
              timestamp: '2026-03-18T10:00:00Z',
              requestId: 'req-mock',
            },
            { status: 500 },
          );
        }),
      );

      await expect(useHistoryStore.getState().fetchArchivedLoans()).rejects.toThrow();

      const state = useHistoryStore.getState();
      expect(state.archivedLoans).toHaveLength(0);
      expect(state.error).not.toBeNull();
      expect(state.error?.status).toBe(500);
      expect(state.error?.detail).toBe('An unexpected error occurred');
      expect(state.isLoading).toBe(false);
    });
  });

  describe('fetchStatistics', () => {
    it('should fetch statistics', async () => {
      await useHistoryStore.getState().fetchStatistics();

      const state = useHistoryStore.getState();
      expect(state.statistics).not.toBeNull();
      expect(state.statistics!.overview.totalLoans).toBe(42);
      expect(state.statistics!.overview.activeLoans).toBe(5);
      expect(state.statistics!.overview.returnedLoans).toBe(35);
      expect(state.statistics!.overview.averageReturnDelay).toBe(-1.5);
      expect(state.statistics!.byCategory).toHaveLength(2);
      expect(state.statistics!.topBorrowers).toHaveLength(1);
      expect(state.statistics!.mostLoanedItems).toHaveLength(1);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle error', async () => {
      server.use(
        http.get(`${API_BASE}/history/statistics`, () => {
          return HttpResponse.json(
            {
              type: 'https://api.return.app/errors/internal-server-error',
              title: 'Internal Server Error',
              status: 500,
              detail: 'An unexpected error occurred',
              instance: '/history/statistics',
              timestamp: '2026-03-18T10:00:00Z',
              requestId: 'req-mock',
            },
            { status: 500 },
          );
        }),
      );

      await expect(useHistoryStore.getState().fetchStatistics()).rejects.toThrow();

      const state = useHistoryStore.getState();
      expect(state.statistics).toBeNull();
      expect(state.error).not.toBeNull();
      expect(state.error?.status).toBe(500);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('reset', () => {
    it('should reset to initial state', async () => {
      await useHistoryStore.getState().fetchArchivedLoans();
      await useHistoryStore.getState().fetchStatistics();
      expect(useHistoryStore.getState().archivedLoans.length).toBeGreaterThan(0);
      expect(useHistoryStore.getState().statistics).not.toBeNull();

      useHistoryStore.getState().reset();

      const state = useHistoryStore.getState();
      expect(state.archivedLoans).toHaveLength(0);
      expect(state.statistics).toBeNull();
      expect(state.pagination).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });
});
