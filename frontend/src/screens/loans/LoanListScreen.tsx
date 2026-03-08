import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  FAB,
  Icon,
  Text,
  Chip,
  SegmentedButtons,
  IconButton,
  Menu,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
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
  const [perspective, setPerspective] = useState<'lender' | 'borrower'>('lender');
  const [tab, setTab] = useState<'active' | 'archived'>('active');
  const [statusFilter, setStatusFilter] = useState<LoanStatus | undefined>();
  const [menuVisible, setMenuVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchLoans({ role: perspective, includeArchived: tab === 'archived' }).catch(() => {});
    }, [fetchLoans, tab, perspective]),
  );

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
        <View style={styles.controlRow}>
          <SegmentedButtons
            value={perspective}
            onValueChange={(v) => {
              setPerspective(v as 'lender' | 'borrower');
              setStatusFilter(undefined);
            }}
            buttons={[
              { value: 'lender', label: t('loans.myLoans') },
              { value: 'borrower', label: t('loans.myBorrowings') },
            ]}
            style={styles.segmentedFlex}
          />
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <IconButton
                icon="filter-variant"
                size={24}
                onPress={() => setMenuVisible(true)}
                accessibilityLabel={t('loans.filterLoans')}
                testID="filter-menu-btn"
              />
            }
          >
            <Menu.Item
              title={t('loans.activeTab')}
              leadingIcon={tab === 'active' ? 'check' : undefined}
              onPress={() => {
                setTab('active');
                setMenuVisible(false);
              }}
              testID="filter-menu-active"
            />
            <Menu.Item
              title={t('loans.archivedTab')}
              leadingIcon={tab === 'archived' ? 'check' : undefined}
              onPress={() => {
                setTab('archived');
                setMenuVisible(false);
              }}
              testID="filter-menu-archived"
            />
          </Menu>
        </View>
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
        contentContainerStyle={
          filteredLoans.length === 0 ? styles.emptyContainer : styles.listContent
        }
        ListEmptyComponent={
          <View style={styles.emptyState} testID="loan-empty">
            <Icon source="handshake-outline" size={64} color="#C9C4BB" />
            <Text variant="titleMedium" style={styles.emptyTitle}>
              {perspective === 'borrower' ? t('loans.emptyBorrowings') : t('loans.emptyList')}
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtitle}>
              {perspective === 'borrower'
                ? t('loans.emptyBorrowingsSubtitle')
                : t('loans.emptyListSubtitle')}
            </Text>
          </View>
        }
      />
      {perspective === 'lender' && (
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => navigation.navigate('CreateLoan')}
          testID="add-loan-fab"
          color="#FFFFFF"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F4EF' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabs: { paddingHorizontal: 16, paddingTop: 12 },
  controlRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  segmentedFlex: { flex: 1 },
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
