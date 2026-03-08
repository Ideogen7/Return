// Force all requests to go through MSW (bypass Prism mock server)
jest.mock('../../../config/api-modules.config', () => ({
  getBaseUrl: () => 'http://localhost:3000/v1',
}));

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import { http, HttpResponse } from 'msw';
import { server } from '../../../../__mocks__/server';
import { SearchBorrowerScreen } from '../SearchBorrowerScreen';
import { useContactInvitationStore } from '../../../stores/useContactInvitationStore';

const API_BASE = 'http://localhost:3000/v1';

function renderScreen() {
  return render(
    <PaperProvider>
      <NavigationContainer>
        <SearchBorrowerScreen />
      </NavigationContainer>
    </PaperProvider>,
  );
}

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  useContactInvitationStore.getState().reset();
});
afterAll(() => server.close());

describe('SearchBorrowerScreen', () => {
  it('should show search input and min length message', () => {
    renderScreen();

    expect(screen.getByTestId('search-input')).toBeTruthy();
    expect(screen.getByTestId('search-min-length')).toBeTruthy();
  });

  it('should display results when query >= 2 chars', async () => {
    renderScreen();

    await act(async () => {
      fireEvent.changeText(screen.getByTestId('search-input'), 'ch');
    });

    await waitFor(() => {
      expect(screen.getByTestId('search-result-search-user-id-9999')).toBeTruthy();
    });

    expect(screen.getByText('Charlie Lemoine')).toBeTruthy();
  });

  it('should show "Contact" chip for already-contact users', async () => {
    server.use(
      http.post(`${API_BASE}/contact-invitations/search`, () => {
        return HttpResponse.json(
          {
            data: [
              {
                id: 'contact-user-1',
                firstName: 'Existing',
                lastName: 'Contact',
                email: 'existing@example.com',
                alreadyContact: true,
                pendingInvitation: false,
                pendingInvitationId: null,
              },
            ],
            pagination: {
              currentPage: 1,
              itemsPerPage: 20,
              totalItems: 1,
              totalPages: 1,
              hasNextPage: false,
              hasPreviousPage: false,
            },
          },
          { status: 200 },
        );
      }),
    );

    renderScreen();

    await act(async () => {
      fireEvent.changeText(screen.getByTestId('search-input'), 'ex');
    });

    await waitFor(() => {
      expect(screen.getByTestId('chip-contact')).toBeTruthy();
    });
  });

  it('should show "Pending" chip after inviting, and remove it after cancel', async () => {
    renderScreen();

    await act(async () => {
      fireEvent.changeText(screen.getByTestId('search-input'), 'ch');
    });

    await waitFor(() => {
      expect(screen.getByTestId('invite-btn')).toBeTruthy();
    });

    // Invite
    await act(async () => {
      fireEvent.press(screen.getByTestId('invite-btn'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('chip-pending')).toBeTruthy();
    });

    // Cancel
    await act(async () => {
      fireEvent.press(screen.getByTestId('cancel-invitation-btn'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('invite-btn')).toBeTruthy();
    });
  });

  it('should show no results message for unknown query', async () => {
    server.use(
      http.post(`${API_BASE}/contact-invitations/search`, () => {
        return HttpResponse.json(
          {
            data: [],
            pagination: {
              currentPage: 1,
              itemsPerPage: 20,
              totalItems: 0,
              totalPages: 0,
              hasNextPage: false,
              hasPreviousPage: false,
            },
          },
          { status: 200 },
        );
      }),
    );

    renderScreen();

    await act(async () => {
      fireEvent.changeText(screen.getByTestId('search-input'), 'zzzzz');
    });

    await waitFor(() => {
      expect(screen.getByTestId('search-no-results')).toBeTruthy();
    });
  });
});
