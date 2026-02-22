import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import { server } from '../../../../__mocks__/server';
import { http, HttpResponse } from 'msw';
import { BorrowerListScreen } from '../BorrowerListScreen';
import { useBorrowerStore } from '../../../stores/useBorrowerStore';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { BorrowerStackParamList } from '../../../navigation/types';

const Stack = createNativeStackNavigator<BorrowerStackParamList>();

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      navigate: mockNavigate,
      goBack: jest.fn(),
    }),
  };
});

function renderListScreen() {
  return render(
    <PaperProvider>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="BorrowerList" component={BorrowerListScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>,
  );
}

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  useBorrowerStore.getState().reset();
  mockNavigate.mockClear();
});
afterAll(() => server.close());

describe('BorrowerListScreen', () => {
  it('should render list with borrowers', async () => {
    renderListScreen();

    await waitFor(() => {
      expect(screen.getByTestId('borrower-list')).toBeTruthy();
    });

    expect(screen.getByTestId('borrower-card-5d6e7f8a-1b2c-4d3e-a5f6-7a8b9c0d1e2f')).toBeTruthy();
  });

  it('should render empty state when no borrowers', async () => {
    server.use(
      http.get('http://localhost:3000/borrowers', () => {
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

    renderListScreen();

    await waitFor(() => {
      expect(screen.getByTestId('borrower-empty')).toBeTruthy();
    });
  });

  it('should navigate to detail on card press', async () => {
    renderListScreen();

    await waitFor(() => {
      expect(screen.getByTestId('borrower-card-5d6e7f8a-1b2c-4d3e-a5f6-7a8b9c0d1e2f')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('borrower-card-5d6e7f8a-1b2c-4d3e-a5f6-7a8b9c0d1e2f'));

    expect(mockNavigate).toHaveBeenCalledWith('BorrowerDetail', {
      id: '5d6e7f8a-1b2c-4d3e-a5f6-7a8b9c0d1e2f',
    });
  });

  it('should navigate to create on FAB press', async () => {
    renderListScreen();

    await waitFor(() => {
      expect(screen.getByTestId('add-borrower-fab')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('add-borrower-fab'));

    expect(mockNavigate).toHaveBeenCalledWith('CreateBorrower');
  });
});
