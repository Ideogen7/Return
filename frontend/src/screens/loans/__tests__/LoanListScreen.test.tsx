import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import { server } from '../../../../__mocks__/server';
import { http, HttpResponse } from 'msw';
import { Text } from 'react-native';
import { LoanListScreen } from '../LoanListScreen';
import { useLoanStore } from '../../../stores/useLoanStore';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { LoanStackParamList } from '../../../navigation/types';

const Stack = createNativeStackNavigator<LoanStackParamList>();

function DummyCreateLoan() {
  return <Text>CreateLoanScreen</Text>;
}

function DummyLoanDetail() {
  return <Text>LoanDetailScreen</Text>;
}

function DummyConfirmLoan() {
  return <Text>ConfirmLoanScreen</Text>;
}

function renderListScreen() {
  return render(
    <PaperProvider>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="LoanList" component={LoanListScreen} />
          <Stack.Screen name="CreateLoan" component={DummyCreateLoan} />
          <Stack.Screen name="LoanDetail" component={DummyLoanDetail} />
          <Stack.Screen name="ConfirmLoan" component={DummyConfirmLoan} />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>,
  );
}

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  useLoanStore.getState().reset();
});
afterAll(() => server.close());

describe('LoanListScreen', () => {
  it('should render list with loans', async () => {
    renderListScreen();

    await waitFor(
      () => {
        expect(screen.getByTestId('loan-list')).toBeTruthy();
        expect(screen.getByTestId('loan-card-7f3c9a2b-4d1e-4a8f-9c7b-1e3f5a6b8c9d')).toBeTruthy();
      },
      { timeout: 10000 },
    );
  }, 15000);

  it('should render empty state when no loans', async () => {
    server.use(
      http.get('http://localhost:4010/loans', () => {
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
      expect(screen.getByTestId('loan-empty')).toBeTruthy();
    });
  });

  it('should navigate to create on FAB press', async () => {
    renderListScreen();

    await waitFor(() => {
      expect(screen.getByTestId('add-loan-fab')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('add-loan-fab'));

    await waitFor(() => {
      expect(screen.getByText('CreateLoanScreen')).toBeTruthy();
    });
  });

  it('should navigate to detail on card press', async () => {
    renderListScreen();

    await waitFor(() => {
      expect(screen.getByTestId('loan-card-7f3c9a2b-4d1e-4a8f-9c7b-1e3f5a6b8c9d')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('loan-card-7f3c9a2b-4d1e-4a8f-9c7b-1e3f5a6b8c9d'));

    await waitFor(() => {
      expect(screen.getByText('LoanDetailScreen')).toBeTruthy();
    });
  });
});
