import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { NotificationListScreen } from '../screens/notifications/NotificationListScreen';
import type { NotificationStackParamList } from './types';

const Stack = createNativeStackNavigator<NotificationStackParamList>();

const screenOptions = {
  headerStyle: { backgroundColor: '#FFFFFF' },
  headerTintColor: '#2D3748',
  headerTitleStyle: { fontWeight: '600' as const },
  headerShadowVisible: false,
};

export function NotificationNavigator() {
  const { t } = useTranslation();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="NotificationList"
        component={NotificationListScreen}
        options={{ title: t('notifications.title') }}
      />
    </Stack.Navigator>
  );
}
