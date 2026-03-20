// Force all requests to go through MSW (bypass Prism mock server)
jest.mock('../../../config/api-modules.config', () => ({
  getBaseUrl: () => 'http://localhost:3000/v1',
}));

import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import { server } from '../../../../__mocks__/server';
import { http, HttpResponse } from 'msw';
import { NotificationListScreen } from '../NotificationListScreen';
import { useNotificationStore } from '../../../stores/useNotificationStore';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootAppStackParamList } from '../../../navigation/types';

const Stack = createNativeStackNavigator<RootAppStackParamList>();

let unmountFn: () => void;

function renderScreen() {
  const result = render(
    <PaperProvider>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="NotificationList" component={NotificationListScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>,
  );
  unmountFn = result.unmount;
  return result;
}

beforeAll(() => server.listen());
afterEach(() => {
  unmountFn?.();
  server.resetHandlers();
  useNotificationStore.getState().reset();
});
afterAll(() => server.close());

describe('NotificationListScreen', () => {
  it('should render list with notifications', async () => {
    renderScreen();

    await waitFor(
      () => {
        expect(screen.getByTestId('notification-list')).toBeTruthy();
        expect(screen.getByTestId('notification-card-notif-unread-1234')).toBeTruthy();
        expect(screen.getByTestId('notification-card-notif-read-5678')).toBeTruthy();
      },
      { timeout: 5000 },
    );
  }, 10000);

  it('should render empty state when no notifications', async () => {
    server.use(
      http.get('http://localhost:3000/v1/notifications', () => {
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

    await waitFor(() => {
      expect(screen.getByTestId('notification-empty')).toBeTruthy();
    });
  });

  it('should show mark-all-read button when unread exist', async () => {
    renderScreen();

    await waitFor(() => {
      expect(screen.getByTestId('mark-all-read-btn')).toBeTruthy();
    });
  });

  it('should mark notification as read on mark-read press', async () => {
    renderScreen();

    await waitFor(() => {
      expect(screen.getByTestId('mark-read-notif-unread-1234')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('mark-read-notif-unread-1234'));

    await waitFor(() => {
      expect(useNotificationStore.getState().unreadCount).toBe(0);
    });
  });

  it('should have filter segmented buttons', async () => {
    renderScreen();

    await waitFor(() => {
      expect(screen.getByTestId('notification-list')).toBeTruthy();
    });

    expect(screen.getByText('All')).toBeTruthy();
    expect(screen.getByText('Unread')).toBeTruthy();
  });
});
