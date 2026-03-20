import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Icon, Text, SegmentedButtons } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LoanCard } from '../../components/loans/LoanCard';
import { useHistoryStore } from '../../stores/useHistoryStore';
import type { HistoryStackParamList } from '../../navigation/types';
import type { Loan, LoanStatus } from '../../types/api.types';

type FilterValue = 'all' | 'returned' | 'not_returned' | 'contested';

const STATUS_MAP: Record<FilterValue, LoanStatus[] | undefined> = {
  all: undefined,
  returned: ['RETURNED'],
  not_returned: ['NOT_RETURNED'],
  contested: ['CONTESTED'],
};

export function HistoryScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<HistoryStackParamList>>();
  const { archivedLoans, pagination, isLoading, fetchArchivedLoans } = useHistoryStore();
  const [filter, setFilter] = useState<FilterValue>('all');

  const loadLoans = useCallback(
    (page = 1) => {
      fetchArchivedLoans({
        status: STATUS_MAP[filter],
        page,
        limit: 20,
      }).catch(() => {});
    },
    [fetchArchivedLoans, filter],
  );

  useFocusEffect(
    useCallback(() => {
      loadLoans(1);
    }, [loadLoans]),
  );

  const handleFilterChange = (value: string) => {
    setFilter(value as FilterValue);
  };

  const handleEndReached = () => {
    if (pagination?.hasNextPage && !isLoading) {
      loadLoans((pagination?.currentPage ?? 0) + 1);
    }
  };

  const handlePress = (id: string) => {
    // Navigate to loan detail in LoanTab stack
    // Since LoanDetail lives in LoanNavigator, we navigate to the root
    // and let the tab navigator handle it
    navigation.getParent()?.navigate('LoanTab', {
      screen: 'LoanDetail',
      params: { id },
    });
  };

  if (isLoading && archivedLoans.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6B8E7B" testID="loading" />
      </View>
    );
  }

  return (
    <View style={styles.container} testID="history-screen">
      <View style={styles.filters}>
        <SegmentedButtons
          value={filter}
          onValueChange={handleFilterChange}
          buttons={[
            { value: 'all', label: t('history.filterAll') },
            { value: 'returned', label: t('history.filterReturned') },
            { value: 'not_returned', label: t('history.filterNotReturned') },
            { value: 'contested', label: t('history.filterContested') },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      <FlatList<Loan>
        data={archivedLoans}
        keyExtractor={(loan) => loan.id}
        renderItem={({ item }) => <LoanCard loan={item} onPress={handlePress} />}
        contentContainerStyle={
          archivedLoans.length === 0 ? styles.emptyContainer : styles.listContent
        }
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.3}
        refreshing={isLoading}
        onRefresh={() => loadLoans(1)}
        ListEmptyComponent={
          <View style={styles.emptyState} testID="history-empty">
            <Icon source="archive-outline" size={64} color="#C9C4BB" />
            <Text variant="titleMedium" style={styles.emptyTitle}>
              {t('history.emptyHistory')}
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtitle}>
              {t('history.emptyHistorySubtitle')}
            </Text>
          </View>
        }
        ListFooterComponent={
          isLoading && archivedLoans.length > 0 ? (
            <ActivityIndicator
              size="small"
              color="#6B8E7B"
              style={styles.footerLoader}
              testID="pagination-loading"
            />
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F4EF' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  filters: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  segmentedButtons: { marginBottom: 8 },
  listContent: { paddingTop: 12, paddingBottom: 80 },
  emptyContainer: { flexGrow: 1 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyTitle: { color: '#2D3748', fontWeight: '600', marginTop: 16 },
  emptySubtitle: { color: '#6B7A8D', marginTop: 8, textAlign: 'center' },
  footerLoader: { paddingVertical: 16 },
});
