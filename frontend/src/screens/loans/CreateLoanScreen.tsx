import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Snackbar } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LoanWizard } from '../../components/loans/LoanWizard';
import { useLoanStore } from '../../stores/useLoanStore';
import { useItemStore } from '../../stores/useItemStore';
import { useBorrowerStore } from '../../stores/useBorrowerStore';
import { parseProblemDetails, getErrorMessage } from '../../utils/error';
import type { LoanStackParamList } from '../../navigation/types';
import type { CreateLoanDto } from '../../types/api.types';
import type { AxiosError } from 'axios';

type Props = NativeStackScreenProps<LoanStackParamList, 'CreateLoan'>;

export function CreateLoanScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | undefined>();
  const [dataLoading, setDataLoading] = useState(true);

  const items = useItemStore((s) => s.items);
  const borrowers = useBorrowerStore((s) => s.borrowers);

  useEffect(() => {
    Promise.all([
      useItemStore.getState().fetchItems().catch(() => {}),
      useBorrowerStore.getState().fetchBorrowers().catch(() => {}),
    ]).finally(() => setDataLoading(false));
  }, []);

  const handleSubmit = async (data: CreateLoanDto) => {
    setIsLoading(true);
    setApiError(undefined);
    try {
      await useLoanStore.getState().createLoan(data);
      navigation.goBack();
    } catch (err) {
      const problem = parseProblemDetails(err as AxiosError);
      setApiError(problem ? getErrorMessage(problem, t) : t('errors.unknownError'));
    } finally {
      setIsLoading(false);
    }
  };

  if (dataLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6B8E7B" testID="loading" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} testID="create-loan-screen">
      <LoanWizard
        onSubmit={handleSubmit}
        isLoading={isLoading}
        error={apiError}
        items={items}
        borrowers={borrowers}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 16 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
