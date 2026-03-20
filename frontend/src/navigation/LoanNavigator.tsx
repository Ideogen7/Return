import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { LoanListScreen } from '../screens/loans/LoanListScreen';
import { CreateLoanScreen } from '../screens/loans/CreateLoanScreen';
import { LoanDetailScreen } from '../screens/loans/LoanDetailScreen';
import { ConfirmLoanScreen } from '../screens/loans/ConfirmLoanScreen';
import { NotificationBell } from '../components/notifications/NotificationBell';
import type { LoanStackParamList } from './types';

const Stack = createNativeStackNavigator<LoanStackParamList>();

const screenOptions = {
  headerStyle: { backgroundColor: '#FFFFFF' },
  headerTintColor: '#2D3748',
  headerTitleStyle: { fontWeight: '600' as const },
  headerShadowVisible: false,
};

export function LoanNavigator() {
  const { t } = useTranslation();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="LoanList"
        component={LoanListScreen}
        options={{ title: t('navigation.tracking'), headerRight: () => <NotificationBell /> }}
      />
      <Stack.Screen
        name="CreateLoan"
        component={CreateLoanScreen}
        options={{ title: t('loans.addLoan') }}
      />
      <Stack.Screen
        name="LoanDetail"
        component={LoanDetailScreen}
        options={{ title: t('loans.details') }}
      />
      <Stack.Screen
        name="ConfirmLoan"
        component={ConfirmLoanScreen}
        options={{ title: t('loans.confirmLoan') }}
      />
    </Stack.Navigator>
  );
}
