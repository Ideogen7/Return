import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { BorrowerListScreen } from '../screens/borrowers/BorrowerListScreen';
import { CreateBorrowerScreen } from '../screens/borrowers/CreateBorrowerScreen';
import { BorrowerDetailScreen } from '../screens/borrowers/BorrowerDetailScreen';
import { EditBorrowerScreen } from '../screens/borrowers/EditBorrowerScreen';
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
        options={{ title: t('borrowers.title') }}
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
    </Stack.Navigator>
  );
}
