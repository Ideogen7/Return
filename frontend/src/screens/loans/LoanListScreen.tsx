import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { ActivityIndicator, FAB, Icon, Text, Chip, SegmentedButtons } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LoanCard } from '../../components/loans/LoanCard';
import { useLoanStore } from '../../stores/useLoanStore';
import type { LoanStackParamList } from '../../navigation/types';
import type { Loan, LoanStatus } from '../../types/api.types';

const ACTIVE_STATUSES: LoanStatus[] = [
  'PENDING_CONFIRMATION',
  'ACTIVE',
  'ACTIVE_BY_DEFAULT',
  'CONTESTED',
  'AWAITING_RETURN',
];

const FILTER_STATUSES: { status: LoanStatus; label: string }[] = [
  { status: 'PENDING_CONFIRMATION', label: 'loans.statusPendingConfirmation' },
  { status: 'ACTIVE', label: 'loans.statusActive' },
  { status: 'AWAITING_RETURN', label: 'loans.statusAwaitingReturn' },
  { status: 'CONTESTED', label: 'loans.statusContested' },
  { status: 'RETURNED', label: 'loans.statusReturned' },
  { status: 'NOT_RETURNED', label: 'loans.statusNotReturned' },
];

type Props = NativeStackScreenProps<LoanStackParamList, 'LoanList'>;

export function LoanListScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { loans, isLoading, error, fetchLoans } = useLoanStore();
  const [tab, setTab] = useState<'active' | 'archived'>('active');
  const [statusFilter, setStatusFilter] = useState<LoanStatus | undefined>();

  useEffect(() => {
    fetchLoans({ includeArchived: tab === 'archived' }).catch(() => {});
  }, [fetchLoans, tab]);

  const handlePress = (id: string) => {
    navigation.navigate('LoanDetail', { id });
  };

  const handleStatusFilter = (status: LoanStatus) => {
    setStatusFilter((prev) => (prev === status ? undefined : status));
  };

  const filteredLoans = loans.filter((loan) => {
    if (tab === 'active' && !ACTIVE_STATUSES.includes(loan.status)) return false;
    if (tab === 'archived' && ACTIVE_STATUSES.includes(loan.status)) return false;
    if (statusFilter && loan.status !== statusFilter) return false;
    return true;
  });

  if (isLoading && loans.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6B8E7B" testID="loading" />
      </View>
    );
  }

  if (error && loans.length === 0) {
    return (
      <View style={styles.centerContainer} testID="loan-error">
        <Icon source="alert-circle-outline" size={64} color="#D97A6B" />
        <Text variant="titleMedium" style={styles.emptyTitle}>
          {t('errors.unknownError')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container} testID="loan-list">
      <View style={styles.tabs}>
        <SegmentedButtons
          value={tab}
          onValueChange={(v) => setTab(v as 'active' | 'archived')}
          buttons={[
            { value: 'active', label: t('loans.activeTab') },
            { value: 'archived', label: t('loans.archivedTab') },
          ]}
          style={styles.segmented}
        />
      </View>

      <View style={styles.filters}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTER_STATUSES}
          keyExtractor={(item) => item.status}
          renderItem={({ item }) => (
            <Chip
              selected={statusFilter === item.status}
              onPress={() => handleStatusFilter(item.status)}
              style={[styles.chip, statusFilter === item.status && styles.chipSelected]}
              textStyle={statusFilter === item.status ? styles.chipTextSelected : undefined}
              testID={`filter-chip-${item.status}`}
            >
              {t(item.label)}
            </Chip>
          )}
          contentContainerStyle={styles.chipRow}
        />
      </View>

      <FlatList<Loan>
        data={filteredLoans}
        keyExtractor={(loan) => loan.id}
        renderItem={({ item }) => <LoanCard loan={item} onPress={handlePress} />}
        contentContainerStyle={filteredLoans.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState} testID="loan-empty">
            <Icon source="handshake-outline" size={64} color="#C9C4BB" />
            <Text variant="titleMedium" style={styles.emptyTitle}>
              {t('loans.emptyList')}
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtitle}>
              {t('loans.emptyListSubtitle')}
            </Text>
          </View>
        }
      />
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('CreateLoan')}
        testID="add-loan-fab"
        color="#FFFFFF"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F4EF' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabs: { paddingHorizontal: 16, paddingTop: 12 },
  segmented: { marginBottom: 8 },
  filters: { paddingBottom: 4 },
  chipRow: { paddingHorizontal: 16, gap: 8 },
  chip: { backgroundColor: '#EDE9E2' },
  chipSelected: { backgroundColor: '#D0E4DB' },
  chipTextSelected: { color: '#4A6355', fontWeight: '600' },
  listContent: { paddingTop: 12, paddingBottom: 80 },
  emptyContainer: { flexGrow: 1 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyTitle: { color: '#2D3748', fontWeight: '600', marginTop: 16 },
  emptySubtitle: { color: '#6B7A8D', marginTop: 8, textAlign: 'center' },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#6B8E7B',
    borderRadius: 16,
  },
});
