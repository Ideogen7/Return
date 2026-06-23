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
  describe('fetchStatistics', () => {
    it('should fetch and store statistics from the API', async () => {
      await useHistoryStore.getState().fetchStatistics();

      const state = useHistoryStore.getState();
      expect(state.statistics).not.toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should populate statistics.overview with values from the API', async () => {
      await useHistoryStore.getState().fetchStatistics();

      const overview = useHistoryStore.getState().statistics?.overview;
      // Default handler (handlers.ts) returns totalLoans=3, activeLoans=1, returnedLoans=2
      expect(overview?.totalLoans).toBe(3);
      expect(overview?.activeLoans).toBe(1);
      expect(overview?.returnedLoans).toBe(2);
    });

    it('should set isLoading to true while request is in flight and false after', async () => {
      const promise = useHistoryStore.getState().fetchStatistics();

      expect(useHistoryStore.getState().isLoading).toBe(true);

      await promise;

      expect(useHistoryStore.getState().isLoading).toBe(false);
    });

    it('should leave statistics null and set error on 500 response (silent fail — no throw)', async () => {
      server.use(
        http.get(`${API_BASE}/history/statistics`, () => {
          return HttpResponse.json(
            {
              type: 'https://api.return.app/errors/internal-server-error',
              title: 'Internal Server Error',
              status: 500,
              detail: 'An unexpected error occurred.',
              instance: '/history/statistics',
              timestamp: '2026-06-23T10:00:00Z',
              requestId: 'req-mock',
            },
            { status: 500 },
          );
        }),
      );

      // fetchStatistics fails silently — it must NOT throw
      await expect(useHistoryStore.getState().fetchStatistics()).resolves.toBeUndefined();

      const state = useHistoryStore.getState();
      expect(state.statistics).toBeNull();
      expect(state.error).not.toBeNull();
      expect(state.error?.status).toBe(500);
      expect(state.isLoading).toBe(false);
    });

    it('should clear error before each new fetch attempt', async () => {
      // Simulate a previous error state
      useHistoryStore.setState({
        error: {
          type: 'https://api.return.app/errors/internal-server-error',
          title: 'Previous Error',
          status: 500,
          detail: 'Previous failure.',
          instance: '/history/statistics',
          timestamp: '2026-06-23T10:00:00Z',
          requestId: 'req-old',
        },
      });

      await useHistoryStore.getState().fetchStatistics();

      expect(useHistoryStore.getState().error).toBeNull();
    });
  });

  describe('reset', () => {
    it('should restore initial state after fetchStatistics', async () => {
      await useHistoryStore.getState().fetchStatistics();
      expect(useHistoryStore.getState().statistics).not.toBeNull();

      useHistoryStore.getState().reset();

      const state = useHistoryStore.getState();
      expect(state.statistics).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });
});
