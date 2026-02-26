import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import { server } from '../../../../__mocks__/server';
import { http, HttpResponse } from 'msw';
import { Text } from 'react-native';
import { ItemListScreen } from '../ItemListScreen';
import { useItemStore } from '../../../stores/useItemStore';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ItemStackParamList } from '../../../navigation/types';

const Stack = createNativeStackNavigator<ItemStackParamList>();

function DummyCreateItem() {
  return <Text>CreateItemScreen</Text>;
}

function DummyItemDetail() {
  return <Text>ItemDetailScreen</Text>;
}

function DummyEditItem() {
  return <Text>EditItemScreen</Text>;
}

function renderListScreen() {
  return render(
    <PaperProvider>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="ItemList" component={ItemListScreen} />
          <Stack.Screen name="CreateItem" component={DummyCreateItem} />
          <Stack.Screen name="ItemDetail" component={DummyItemDetail} />
          <Stack.Screen name="EditItem" component={DummyEditItem} />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>,
  );
}

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  useItemStore.getState().reset();
});
afterAll(() => server.close());

describe('ItemListScreen', () => {
  it('should render list with items', async () => {
    renderListScreen();

    await waitFor(
      () => {
        expect(screen.getByTestId('item-list')).toBeTruthy();
        expect(screen.getByTestId('item-card-9a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d')).toBeTruthy();
      },
      { timeout: 10000 },
    );
  }, 15000);

  it('should render empty state when no items', async () => {
    server.use(
      http.get('http://localhost:4010/items', () => {
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
      expect(screen.getByTestId('item-empty')).toBeTruthy();
    });
  });

  it('should navigate to detail on card press', async () => {
    renderListScreen();

    await waitFor(() => {
      expect(screen.getByTestId('item-card-9a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('item-card-9a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d'));

    await waitFor(() => {
      expect(screen.getByText('ItemDetailScreen')).toBeTruthy();
    });
  });

  it('should navigate to create on FAB press', async () => {
    renderListScreen();

    await waitFor(() => {
      expect(screen.getByTestId('add-item-fab')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('add-item-fab'));

    await waitFor(() => {
      expect(screen.getByText('CreateItemScreen')).toBeTruthy();
    });
  });
});
