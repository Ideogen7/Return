import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import { server } from '../../../../__mocks__/server';
import { http, HttpResponse } from 'msw';
import { BorrowerDetailScreen } from '../BorrowerDetailScreen';
import { useBorrowerStore } from '../../../stores/useBorrowerStore';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { BorrowerStackParamList } from '../../../navigation/types';

const Stack = createNativeStackNavigator<BorrowerStackParamList>();

const mockGoBack = jest.fn();
const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      navigate: mockNavigate,
      goBack: mockGoBack,
    }),
  };
});

function renderDetailScreen() {
  return render(
    <PaperProvider>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen
            name="BorrowerDetail"
            component={BorrowerDetailScreen}
            initialParams={{ id: '5d6e7f8a-1b2c-4d3e-a5f6-7a8b9c0d1e2f' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>,
  );
}

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  useBorrowerStore.getState().reset();
  mockGoBack.mockClear();
  mockNavigate.mockClear();
});
afterAll(() => server.close());

describe('BorrowerDetailScreen', () => {
  it('should render borrower details', async () => {
    renderDetailScreen();

    await waitFor(() => {
      expect(screen.getByTestId('borrower-detail')).toBeTruthy();
    });

    expect(screen.getByText('Marie Dupont')).toBeTruthy();
    expect(screen.getByText('marie.dupont@example.com')).toBeTruthy();
  });

  it('should show delete confirmation dialog', async () => {
    renderDetailScreen();

    await waitFor(() => {
      expect(screen.getByTestId('delete-borrower-btn')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('delete-borrower-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('confirm-delete-dialog')).toBeTruthy();
      expect(screen.getByTestId('confirm-delete-btn')).toBeTruthy();
      expect(screen.getByTestId('cancel-delete-btn')).toBeTruthy();
    });
  });

  it('should delete and go back on confirm', async () => {
    renderDetailScreen();

    await waitFor(() => {
      expect(screen.getByTestId('delete-borrower-btn')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('delete-borrower-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('confirm-delete-btn')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('confirm-delete-btn'));

    await waitFor(() => {
      expect(mockGoBack).toHaveBeenCalled();
    });
  });

  it('should show API error on 409 delete', async () => {
    server.use(
      http.delete('http://localhost:3000/borrowers/:id', () => {
        return HttpResponse.json(
          {
            type: 'https://api.return.app/errors/active-loans-exist',
            title: 'Active Loans Exist',
            status: 409,
            detail: 'Cannot delete borrower with active loans.',
            instance: '/borrowers/5d6e7f8a-1b2c-4d3e-a5f6-7a8b9c0d1e2f',
            timestamp: '2026-02-22T10:00:00Z',
            requestId: 'req-mock',
          },
          { status: 409 },
        );
      }),
    );

    renderDetailScreen();

    await waitFor(() => {
      expect(screen.getByTestId('delete-borrower-btn')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('delete-borrower-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('confirm-delete-btn')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('confirm-delete-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('api-error')).toBeTruthy();
    });
  });
});
