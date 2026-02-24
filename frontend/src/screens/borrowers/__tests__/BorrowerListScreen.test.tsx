import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import { server } from '../../../../__mocks__/server';
import { http, HttpResponse } from 'msw';
import { Text } from 'react-native';
import { BorrowerListScreen } from '../BorrowerListScreen';
import { useBorrowerStore } from '../../../stores/useBorrowerStore';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { BorrowerStackParamList } from '../../../navigation/types';

const Stack = createNativeStackNavigator<BorrowerStackParamList>();

function DummyCreateBorrower() {
  return <Text>CreateBorrowerScreen</Text>;
}

function DummyBorrowerDetail() {
  return <Text>BorrowerDetailScreen</Text>;
}

function DummyEditBorrower() {
  return <Text>EditBorrowerScreen</Text>;
}

function renderListScreen() {
  return render(
    <PaperProvider>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="BorrowerList" component={BorrowerListScreen} />
          <Stack.Screen name="CreateBorrower" component={DummyCreateBorrower} />
          <Stack.Screen name="BorrowerDetail" component={DummyBorrowerDetail} />
          <Stack.Screen name="EditBorrower" component={DummyEditBorrower} />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>,
  );
}

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  useBorrowerStore.getState().reset();
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
      http.get('http://localhost:3000/v1/borrowers', () => {
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

    await waitFor(() => {
      expect(screen.getByText('BorrowerDetailScreen')).toBeTruthy();
    });
  });

  it('should navigate to create on FAB press', async () => {
    renderListScreen();

    await waitFor(() => {
      expect(screen.getByTestId('add-borrower-fab')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('add-borrower-fab'));

    await waitFor(() => {
      expect(screen.getByText('CreateBorrowerScreen')).toBeTruthy();
    });
  });
});
