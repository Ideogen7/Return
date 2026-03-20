import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Icon } from 'react-native-paper';
import { LoanNavigator } from './LoanNavigator';
import { HistoryNavigator } from './HistoryNavigator';
import { BorrowerNavigator } from './BorrowerNavigator';
import { ItemNavigator } from './ItemNavigator';
import { ProfileNavigator } from './ProfileNavigator';
import { NotificationListScreen } from '../screens/notifications/NotificationListScreen';
import { useContactInvitationStore } from '../stores/useContactInvitationStore';
import type { AppTabParamList, RootAppStackParamList } from './types';

const Tab = createBottomTabNavigator<AppTabParamList>();
const Stack = createNativeStackNavigator<RootAppStackParamList>();

function TabNavigator() {
  const { t } = useTranslation();
  const pendingCount = useContactInvitationStore((s) => s.pendingCount);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#6B8E7B',
        tabBarInactiveTintColor: '#A8B5BF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#EDE9E2',
          height: 76,
          paddingBottom: 12,
          paddingTop: 10,
        },
        tabBarIconStyle: {
          marginBottom: 2,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="LoanTab"
        component={LoanNavigator}
        options={{
          title: t('navigation.tracking'),
          tabBarIcon: ({ color, size }) => (
            <Icon source="handshake-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="HistoryTab"
        component={HistoryNavigator}
        options={{
          title: t('navigation.history'),
          tabBarIcon: ({ color, size }) => <Icon source="chart-line" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="BorrowerTab"
        component={BorrowerNavigator}
        options={{
          title: t('navigation.contacts'),
          tabBarIcon: ({ color, size }) => (
            <Icon source="account-group-outline" color={color} size={size} />
          ),
          tabBarBadge: pendingCount > 0 ? pendingCount : undefined,
        }}
      />
      <Tab.Screen
        name="ItemTab"
        component={ItemNavigator}
        options={{
          title: t('navigation.items'),
          tabBarIcon: ({ color, size }) => (
            <Icon source="package-variant-closed" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileNavigator}
        options={{
          title: t('navigation.profile'),
          tabBarIcon: ({ color, size }) => (
            <Icon source="account-circle-outline" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { t } = useTranslation();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTintColor: '#2D3748',
        headerTitleStyle: { fontWeight: '600' },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="Tabs" component={TabNavigator} options={{ headerShown: false }} />
      <Stack.Screen
        name="NotificationList"
        component={NotificationListScreen}
        options={{ title: t('notifications.title') }}
      />
    </Stack.Navigator>
  );
}
