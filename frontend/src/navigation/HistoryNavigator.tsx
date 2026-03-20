import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { DashboardScreen } from '../screens/history/DashboardScreen';
import { HistoryScreen } from '../screens/history/HistoryScreen';
import { StatisticsScreen } from '../screens/history/StatisticsScreen';
import { NotificationBell } from '../components/notifications/NotificationBell';
import type { HistoryStackParamList } from './types';

const Stack = createNativeStackNavigator<HistoryStackParamList>();

const screenOptions = {
  headerStyle: { backgroundColor: '#FFFFFF' },
  headerTintColor: '#2D3748',
  headerTitleStyle: { fontWeight: '600' as const },
  headerShadowVisible: false,
};

export function HistoryNavigator() {
  const { t } = useTranslation();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: t('navigation.history'), headerRight: () => <NotificationBell /> }}
      />
      <Stack.Screen
        name="History"
        component={HistoryScreen}
        options={{ title: t('history.archivedLoans') }}
      />
      <Stack.Screen
        name="Statistics"
        component={StatisticsScreen}
        options={{ title: t('history.statistics') }}
      />
    </Stack.Navigator>
  );
}
