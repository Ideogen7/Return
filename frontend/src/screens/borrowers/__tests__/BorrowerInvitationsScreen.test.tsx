// Force all requests to go through MSW (bypass Prism mock server)
jest.mock('../../../config/api-modules.config', () => ({
  getBaseUrl: () => 'http://localhost:3000/v1',
}));

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import { server } from '../../../../__mocks__/server';
import { BorrowerInvitationsScreen } from '../BorrowerInvitationsScreen';
import { useContactInvitationStore } from '../../../stores/useContactInvitationStore';

function renderScreen() {
  return render(
    <PaperProvider>
      <NavigationContainer>
        <BorrowerInvitationsScreen />
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

describe('BorrowerInvitationsScreen', () => {
  it('should display received PENDING invitations', async () => {
    renderScreen();

    await waitFor(() => {
      expect(screen.getByTestId('invitation-inv-received-1234')).toBeTruthy();
    });

    expect(screen.getByText('Alice Martin')).toBeTruthy();
  });

  it('should remove invitation on accept', async () => {
    renderScreen();

    await waitFor(() => {
      expect(screen.getByTestId('accept-inv-received-1234')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(screen.getByTestId('accept-inv-received-1234'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('invitations-empty')).toBeTruthy();
    });
  });

  it('should remove invitation on reject', async () => {
    renderScreen();

    await waitFor(() => {
      expect(screen.getByTestId('reject-inv-received-1234')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(screen.getByTestId('reject-inv-received-1234'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('invitations-empty')).toBeTruthy();
    });
  });
});
