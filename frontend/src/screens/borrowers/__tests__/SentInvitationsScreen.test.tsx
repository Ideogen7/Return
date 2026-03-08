// Force all requests to go through MSW (bypass Prism mock server)
jest.mock('../../../config/api-modules.config', () => ({
  getBaseUrl: () => 'http://localhost:3000/v1',
}));

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import { server } from '../../../../__mocks__/server';
import { SentInvitationsScreen } from '../SentInvitationsScreen';
import { useContactInvitationStore } from '../../../stores/useContactInvitationStore';

function renderScreen() {
  return render(
    <PaperProvider>
      <NavigationContainer>
        <SentInvitationsScreen />
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

describe('SentInvitationsScreen', () => {
  it('should display sent invitations with status chip', async () => {
    renderScreen();

    await waitFor(() => {
      expect(screen.getByTestId('sent-invitation-inv-sent-5678')).toBeTruthy();
    });

    expect(screen.getByText('Bob Durand')).toBeTruthy();
    expect(screen.getByTestId('status-chip-inv-sent-5678')).toBeTruthy();
  });

  it('should remove PENDING invitation on cancel', async () => {
    renderScreen();

    await waitFor(() => {
      expect(screen.getByTestId('cancel-inv-sent-5678')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(screen.getByTestId('cancel-inv-sent-5678'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('sent-invitations-empty')).toBeTruthy();
    });
  });
});
