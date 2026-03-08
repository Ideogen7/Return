// Force all requests to go through MSW (bypass Prism mock server)
jest.mock('../../config/api-modules.config', () => ({
  getBaseUrl: () => 'http://localhost:3000/v1',
}));

import { http, HttpResponse } from 'msw';
import { server } from '../../../__mocks__/server';
import { useContactInvitationStore } from '../useContactInvitationStore';

const API_BASE = 'http://localhost:3000/v1';

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  useContactInvitationStore.getState().reset();
});
afterAll(() => server.close());

describe('useContactInvitationStore', () => {
  describe('fetchReceivedInvitations', () => {
    it('should fetch received invitations and update pendingCount', async () => {
      await useContactInvitationStore.getState().fetchReceivedInvitations();

      const state = useContactInvitationStore.getState();
      expect(state.receivedInvitations).toHaveLength(1);
      expect(state.receivedInvitations[0]!.senderUser.firstName).toBe('Alice');
      expect(state.pendingCount).toBe(1);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('fetchSentInvitations', () => {
    it('should fetch sent invitations', async () => {
      await useContactInvitationStore.getState().fetchSentInvitations();

      const state = useContactInvitationStore.getState();
      expect(state.sentInvitations).toHaveLength(1);
      expect(state.sentInvitations[0]!.recipientUser.firstName).toBe('Bob');
      expect(state.isLoading).toBe(false);
    });
  });

  describe('searchUsers', () => {
    it('should search users and set isSearching', async () => {
      const promise = useContactInvitationStore.getState().searchUsers('charlie');

      expect(useContactInvitationStore.getState().isSearching).toBe(true);

      await promise;

      const state = useContactInvitationStore.getState();
      expect(state.searchResults).toHaveLength(1);
      expect(state.searchResults[0]!.firstName).toBe('Charlie');
      expect(state.isSearching).toBe(false);
    });
  });

  describe('sendInvitation', () => {
    it('should send invitation and update search results optimistically', async () => {
      // First populate search results
      await useContactInvitationStore.getState().searchUsers('charlie');

      const invitation = await useContactInvitationStore
        .getState()
        .sendInvitation('charlie.lemoine@example.com');

      expect(invitation.id).toBe('inv-new-1234');

      const state = useContactInvitationStore.getState();
      const result = state.searchResults.find((r) => r.email === 'charlie.lemoine@example.com');
      expect(result?.pendingInvitation).toBe(true);
      expect(result?.pendingInvitationId).toBe('inv-new-1234');
      expect(state.isLoading).toBe(false);
    });
  });

  describe('acceptInvitation', () => {
    it('should remove invitation from received list', async () => {
      await useContactInvitationStore.getState().fetchReceivedInvitations();
      expect(useContactInvitationStore.getState().receivedInvitations).toHaveLength(1);

      const invId = useContactInvitationStore.getState().receivedInvitations[0]!.id;
      await useContactInvitationStore.getState().acceptInvitation(invId);

      const state = useContactInvitationStore.getState();
      expect(state.receivedInvitations).toHaveLength(0);
      expect(state.pendingCount).toBe(0);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('rejectInvitation', () => {
    it('should remove invitation from received list', async () => {
      await useContactInvitationStore.getState().fetchReceivedInvitations();
      expect(useContactInvitationStore.getState().receivedInvitations).toHaveLength(1);

      const invId = useContactInvitationStore.getState().receivedInvitations[0]!.id;
      await useContactInvitationStore.getState().rejectInvitation(invId);

      const state = useContactInvitationStore.getState();
      expect(state.receivedInvitations).toHaveLength(0);
      expect(state.pendingCount).toBe(0);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('cancelInvitation', () => {
    it('should remove invitation from sent list and reset search results', async () => {
      await useContactInvitationStore.getState().fetchSentInvitations();
      expect(useContactInvitationStore.getState().sentInvitations).toHaveLength(1);

      const invId = useContactInvitationStore.getState().sentInvitations[0]!.id;
      await useContactInvitationStore.getState().cancelInvitation(invId);

      const state = useContactInvitationStore.getState();
      expect(state.sentInvitations).toHaveLength(0);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('error paths', () => {
    it('should set error state on fetchReceivedInvitations failure', async () => {
      server.use(
        http.get(`${API_BASE}/contact-invitations`, () => {
          return HttpResponse.json(
            {
              type: 'https://api.return.app/errors/internal-server-error',
              title: 'Internal Server Error',
              status: 500,
              detail: 'An unexpected error occurred',
              instance: '/contact-invitations',
              timestamp: '2026-03-08T10:00:00Z',
              requestId: 'req-mock',
            },
            { status: 500 },
          );
        }),
      );

      await expect(
        useContactInvitationStore.getState().fetchReceivedInvitations(),
      ).rejects.toThrow();

      const state = useContactInvitationStore.getState();
      expect(state.receivedInvitations).toHaveLength(0);
      expect(state.error).not.toBeNull();
      expect(state.error?.status).toBe(500);
      expect(state.isLoading).toBe(false);
    });

    it('should set error state on sendInvitation failure (409 already sent)', async () => {
      server.use(
        http.post(`${API_BASE}/contact-invitations`, () => {
          return HttpResponse.json(
            {
              type: 'https://api.return.app/errors/invitation-already-sent',
              title: 'Invitation Already Sent',
              status: 409,
              detail: 'A pending invitation already exists for this email.',
              instance: '/contact-invitations',
              timestamp: '2026-03-08T10:00:00Z',
              requestId: 'req-mock',
            },
            { status: 409 },
          );
        }),
      );

      await expect(
        useContactInvitationStore.getState().sendInvitation('already@example.com'),
      ).rejects.toThrow();

      const state = useContactInvitationStore.getState();
      expect(state.error?.status).toBe(409);
      expect(state.isLoading).toBe(false);
    });
  });
});
