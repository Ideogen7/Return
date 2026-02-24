import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { Icon } from 'react-native-paper';
import { BorrowerNavigator } from './BorrowerNavigator';
import { ProfileNavigator } from './ProfileNavigator';
import type { AppTabParamList } from './types';

const Tab = createBottomTabNavigator<AppTabParamList>();

export function AppNavigator() {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#6B8E7B',
        tabBarInactiveTintColor: '#A8B5BF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#EDE9E2',
        },
      }}
    >
      <Tab.Screen
        name="BorrowerTab"
        component={BorrowerNavigator}
        options={{
          title: t('navigation.contacts'),
          tabBarIcon: ({ color, size }) => (
            <Icon source="account-group-outline" color={color} size={size} />
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
