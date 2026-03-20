import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { BorrowerListScreen } from '../screens/borrowers/BorrowerListScreen';
import { CreateBorrowerScreen } from '../screens/borrowers/CreateBorrowerScreen';
import { BorrowerDetailScreen } from '../screens/borrowers/BorrowerDetailScreen';
import { EditBorrowerScreen } from '../screens/borrowers/EditBorrowerScreen';
import { SearchBorrowerScreen } from '../screens/borrowers/SearchBorrowerScreen';
import { BorrowerInvitationsScreen } from '../screens/borrowers/BorrowerInvitationsScreen';
import { SentInvitationsScreen } from '../screens/borrowers/SentInvitationsScreen';
import { NotificationBell } from '../components/notifications/NotificationBell';
import type { BorrowerStackParamList } from './types';

const Stack = createNativeStackNavigator<BorrowerStackParamList>();

const screenOptions = {
  headerStyle: { backgroundColor: '#FFFFFF' },
  headerTintColor: '#2D3748',
  headerTitleStyle: { fontWeight: '600' as const },
  headerShadowVisible: false,
};

export function BorrowerNavigator() {
  const { t } = useTranslation();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="BorrowerList"
        component={BorrowerListScreen}
        options={{ title: t('borrowers.title'), headerRight: () => <NotificationBell /> }}
      />
      <Stack.Screen
        name="CreateBorrower"
        component={CreateBorrowerScreen}
        options={{ title: t('borrowers.addContact') }}
      />
      <Stack.Screen
        name="BorrowerDetail"
        component={BorrowerDetailScreen}
        options={{ title: t('borrowers.details') }}
      />
      <Stack.Screen
        name="EditBorrower"
        component={EditBorrowerScreen}
        options={{ title: t('borrowers.editContact') }}
      />
      <Stack.Screen
        name="SearchBorrower"
        component={SearchBorrowerScreen}
        options={{ title: t('invitations.searchPlaceholder') }}
      />
      <Stack.Screen
        name="BorrowerInvitations"
        component={BorrowerInvitationsScreen}
        options={{ title: t('invitations.receivedTitle') }}
      />
      <Stack.Screen
        name="SentInvitations"
        component={SentInvitationsScreen}
        options={{ title: t('invitations.sentTitle') }}
      />
    </Stack.Navigator>
  );
}
