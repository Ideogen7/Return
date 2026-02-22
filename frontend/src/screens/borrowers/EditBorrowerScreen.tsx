import { useEffect, useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BorrowerForm } from '../../components/borrowers/BorrowerForm';
import { useBorrowerStore } from '../../stores/useBorrowerStore';
import { parseProblemDetails, getErrorMessage } from '../../utils/error';
import type { BorrowerStackParamList } from '../../navigation/types';
import type { CreateBorrowerDto } from '../../types/api.types';
import type { AxiosError } from 'axios';

type Props = NativeStackScreenProps<BorrowerStackParamList, 'EditBorrower'>;

export function EditBorrowerScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const { t } = useTranslation();
  const { selectedBorrower, isLoading: storeLoading, fetchBorrower } = useBorrowerStore();
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | undefined>();

  useEffect(() => {
    if (!selectedBorrower || selectedBorrower.id !== id) {
      fetchBorrower(id);
    }
  }, [id, selectedBorrower, fetchBorrower]);

  if (storeLoading || !selectedBorrower) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6B8E7B" testID="loading" />
      </View>
    );
  }

  const handleSubmit = async (data: CreateBorrowerDto) => {
    setIsLoading(true);
    setApiError(undefined);
    try {
      await useBorrowerStore.getState().updateBorrower(id, data);
      navigation.goBack();
    } catch (err) {
      const problem = parseProblemDetails(err as AxiosError);
      setApiError(problem ? getErrorMessage(problem, t) : t('errors.unknownError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <BorrowerForm
        defaultValues={{
          firstName: selectedBorrower.firstName,
          lastName: selectedBorrower.lastName,
          email: selectedBorrower.email,
          phoneNumber: selectedBorrower.phoneNumber ?? '',
        }}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        error={apiError}
        submitLabel={t('common.save')}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 16 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
