import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { Icon } from 'react-native-paper';
import { LoanNavigator } from './LoanNavigator';
import { BorrowerNavigator } from './BorrowerNavigator';
import { ItemNavigator } from './ItemNavigator';
import { NotificationNavigator } from './NotificationNavigator';
import { ProfileNavigator } from './ProfileNavigator';
import { useContactInvitationStore } from '../stores/useContactInvitationStore';
import { useNotificationStore } from '../stores/useNotificationStore';
import type { AppTabParamList } from './types';

const Tab = createBottomTabNavigator<AppTabParamList>();

export function AppNavigator() {
  const { t } = useTranslation();
  const pendingCount = useContactInvitationStore((s) => s.pendingCount);
  const unreadCount = useNotificationStore((s) => s.unreadCount);

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
        name="NotificationTab"
        component={NotificationNavigator}
        options={{
          title: t('navigation.notifications'),
          tabBarIcon: ({ color, size }) => <Icon source="bell-outline" color={color} size={size} />,
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
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
