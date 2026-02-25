import { http, HttpResponse } from 'msw';
import { server } from '../../../__mocks__/server';
import { useBorrowerStore } from '../useBorrowerStore';

const API_BASE = 'http://localhost:3000/v1';

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  useBorrowerStore.getState().reset();
});
afterAll(() => server.close());

describe('useBorrowerStore', () => {
  describe('fetchBorrowers', () => {
    it('should fetch and store borrowers list', async () => {
      await useBorrowerStore.getState().fetchBorrowers();

      const state = useBorrowerStore.getState();
      expect(state.borrowers).toHaveLength(1);
      expect(state.borrowers[0]!.firstName).toBe('Marie');
      expect(state.borrowers[0]!.lastName).toBe('Dupont');
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should set error on fetch failure', async () => {
      server.use(
        http.get(`${API_BASE}/borrowers`, () => {
          return HttpResponse.json(
            {
              type: 'https://api.return.app/errors/network-error',
              title: 'Server Error',
              status: 500,
              detail: 'Internal server error.',
              instance: '/borrowers',
              timestamp: '2026-02-22T10:00:00Z',
              requestId: 'req-mock',
            },
            { status: 500 },
          );
        }),
      );

      await expect(useBorrowerStore.getState().fetchBorrowers()).rejects.toThrow();

      const state = useBorrowerStore.getState();
      expect(state.borrowers).toHaveLength(0);
      expect(state.isLoading).toBe(false);
      expect(state.error).not.toBeNull();
    });
  });

  describe('createBorrower', () => {
    it('should create and add borrower to list', async () => {
      const newBorrower = await useBorrowerStore.getState().createBorrower({
        firstName: 'Pierre',
        lastName: 'Martin',
        email: 'pierre@example.com',
      });

      expect(newBorrower.firstName).toBe('Pierre');
      expect(newBorrower.lastName).toBe('Martin');

      const state = useBorrowerStore.getState();
      expect(state.borrowers).toHaveLength(1);
      expect(state.isLoading).toBe(false);
    });

    it('should set error on 409 (borrower already exists)', async () => {
      server.use(
        http.post(`${API_BASE}/borrowers`, () => {
          return HttpResponse.json(
            {
              type: 'https://api.return.app/errors/borrower-already-exists',
              title: 'Borrower Already Exists',
              status: 409,
              detail: 'A borrower with this email already exists.',
              instance: '/borrowers',
              timestamp: '2026-02-22T10:00:00Z',
              requestId: 'req-mock',
            },
            { status: 409 },
          );
        }),
      );

      await expect(
        useBorrowerStore.getState().createBorrower({
          firstName: 'Marie',
          lastName: 'Dupont',
          email: 'marie.dupont@example.com',
        }),
      ).rejects.toThrow();

      const state = useBorrowerStore.getState();
      expect(state.error?.status).toBe(409);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('updateBorrower', () => {
    it('should update borrower in list', async () => {
      // First fetch to populate list
      await useBorrowerStore.getState().fetchBorrowers();

      const borrowerId = useBorrowerStore.getState().borrowers[0]!.id;
      const updated = await useBorrowerStore.getState().updateBorrower(borrowerId, {
        firstName: 'Marie-Claire',
      });

      expect(updated.firstName).toBe('Marie-Claire');

      const state = useBorrowerStore.getState();
      expect(state.borrowers[0]!.firstName).toBe('Marie-Claire');
      expect(state.isLoading).toBe(false);
    });
  });

  describe('deleteBorrower', () => {
    it('should remove borrower from list', async () => {
      // First fetch to populate list
      await useBorrowerStore.getState().fetchBorrowers();
      expect(useBorrowerStore.getState().borrowers).toHaveLength(1);

      const borrowerId = useBorrowerStore.getState().borrowers[0]!.id;
      await useBorrowerStore.getState().deleteBorrower(borrowerId);

      const state = useBorrowerStore.getState();
      expect(state.borrowers).toHaveLength(0);
      expect(state.isLoading).toBe(false);
    });

    it('should set error on 409 (active loans exist)', async () => {
      server.use(
        http.delete(`${API_BASE}/borrowers/:id`, () => {
          return HttpResponse.json(
            {
              type: 'https://api.return.app/errors/active-loans-exist',
              title: 'Active Loans Exist',
              status: 409,
              detail: 'Cannot delete borrower with active loans.',
              instance: '/borrowers/some-id',
              timestamp: '2026-02-22T10:00:00Z',
              requestId: 'req-mock',
            },
            { status: 409 },
          );
        }),
      );

      await expect(useBorrowerStore.getState().deleteBorrower('some-id')).rejects.toThrow();

      const state = useBorrowerStore.getState();
      expect(state.error?.status).toBe(409);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('fetchBorrower', () => {
    it('should fetch and store a single borrower', async () => {
      await useBorrowerStore.getState().fetchBorrower('5d6e7f8a-1b2c-4d3e-a5f6-7a8b9c0d1e2f');

      const state = useBorrowerStore.getState();
      expect(state.selectedBorrower).not.toBeNull();
      expect(state.selectedBorrower?.firstName).toBe('Marie');
      expect(state.isLoading).toBe(false);
    });

    it('should set error on 404', async () => {
      await expect(useBorrowerStore.getState().fetchBorrower('not-found')).rejects.toThrow();

      const state = useBorrowerStore.getState();
      expect(state.selectedBorrower).toBeNull();
      expect(state.error?.status).toBe(404);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('fetchBorrowerStats', () => {
    it('should fetch and store borrower statistics', async () => {
      await useBorrowerStore.getState().fetchBorrowerStats('5d6e7f8a-1b2c-4d3e-a5f6-7a8b9c0d1e2f');

      const state = useBorrowerStore.getState();
      expect(state.selectedBorrowerStats).not.toBeNull();
      expect(state.selectedBorrowerStats?.trustScore).toBe(75);
      expect(state.selectedBorrowerStats?.totalLoans).toBe(5);
    });
  });
});
