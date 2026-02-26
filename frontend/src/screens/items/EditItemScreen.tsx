import { useEffect, useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { ActivityIndicator, Text, Button } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ItemForm } from '../../components/items/ItemForm';
import { useItemStore } from '../../stores/useItemStore';
import { parseProblemDetails, getErrorMessage } from '../../utils/error';
import type { ItemStackParamList } from '../../navigation/types';
import type { UpdateItemDto } from '../../types/api.types';
import type { AxiosError } from 'axios';

type Props = NativeStackScreenProps<ItemStackParamList, 'EditItem'>;

export function EditItemScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const { t } = useTranslation();
  const { selectedItem, isLoading: storeLoading, error: storeError, fetchItem } = useItemStore();
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | undefined>();

  useEffect(() => {
    if (!selectedItem || selectedItem.id !== id) {
      fetchItem(id).catch(() => {});
    }
  }, [id, selectedItem, fetchItem]);

  if (storeLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6B8E7B" testID="loading" />
      </View>
    );
  }

  if (!selectedItem) {
    return (
      <View style={styles.centerContainer} testID="item-error">
        <Text variant="titleMedium" style={styles.errorText}>
          {storeError ? t('errors.itemNotFound') : t('errors.unknownError')}
        </Text>
        <Button mode="outlined" onPress={() => navigation.goBack()} style={styles.backButton}>
          {t('common.back')}
        </Button>
      </View>
    );
  }

  const handleSubmit = async (data: UpdateItemDto) => {
    setIsLoading(true);
    setApiError(undefined);
    try {
      await useItemStore.getState().updateItem(id, data);
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
      <ItemForm
        mode="edit"
        defaultValues={{
          name: selectedItem.name,
          category: selectedItem.category,
          description: selectedItem.description ?? '',
          estimatedValue: selectedItem.estimatedValue ?? undefined,
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
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  errorText: { color: '#6B7A8D', textAlign: 'center', marginBottom: 16 },
  backButton: { borderRadius: 12 },
});
