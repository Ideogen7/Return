import { useCallback } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Icon, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatCard } from '../../components/history/StatCard';
import { useHistoryStore } from '../../stores/useHistoryStore';
import type { HistoryStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<HistoryStackParamList, 'Dashboard'>;

export function DashboardScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { statistics, isLoading, fetchStatistics } = useHistoryStore();

  useFocusEffect(
    useCallback(() => {
      fetchStatistics().catch(() => {});
    }, [fetchStatistics]),
  );

  const handleRefresh = () => {
    fetchStatistics().catch(() => {});
  };

  if (isLoading && !statistics) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6B8E7B" testID="loading" />
      </View>
    );
  }

  if (!statistics || statistics.overview.totalLoans === 0) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.emptyState}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} colors={['#6B8E7B']} />
        }
        testID="dashboard-screen"
      >
        <Icon source="chart-line" size={64} color="#C9C4BB" />
        <Text variant="titleMedium" style={styles.emptyTitle}>
          {t('history.emptyDashboard')}
        </Text>
        <Text variant="bodyMedium" style={styles.emptySubtitle}>
          {t('history.emptyDashboardSubtitle')}
        </Text>
      </ScrollView>
    );
  }

  const { overview, topBorrowers, mostLoanedItems } = statistics;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} colors={['#6B8E7B']} />
      }
      testID="dashboard-screen"
    >
      {/* Overview section */}
      <Text variant="titleMedium" style={styles.sectionTitle}>
        {t('history.overview')}
      </Text>
      <View style={styles.grid}>
        <View style={styles.gridRow}>
          <StatCard
            title={t('history.totalLoans')}
            value={overview.totalLoans}
            icon="swap-horizontal"
            color="#6B8E7B"
            testID="stat-total-loans"
          />
          <StatCard
            title={t('history.activeLoans')}
            value={overview.activeLoans}
            icon="clock-outline"
            color="#D97A6B"
            testID="stat-active-loans"
          />
        </View>
        <View style={styles.gridRow}>
          <StatCard
            title={t('history.returnedLoans')}
            value={overview.returnedLoans}
            icon="check-all"
            color="#4A6355"
            testID="stat-returned-loans"
          />
          <StatCard
            title={t('history.notReturnedLoans')}
            value={overview.notReturnedLoans}
            icon="close-circle-outline"
            color="#9B4E44"
            testID="stat-not-returned-loans"
          />
        </View>
      </View>

      {/* Top borrowers section */}
      {topBorrowers.length > 0 && (
        <>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            {t('history.topBorrowers')}
          </Text>
          <View style={styles.listSection}>
            {topBorrowers.slice(0, 3).map((entry, index) => (
              <View key={entry.borrower.id} style={styles.listItem}>
                <View style={styles.rankBadge}>
                  <Text variant="labelMedium" style={styles.rankText}>
                    {index + 1}
                  </Text>
                </View>
                <View style={styles.listItemInfo}>
                  <Text variant="bodyLarge" style={styles.listItemName} numberOfLines={1}>
                    {entry.borrower.firstName} {entry.borrower.lastName}
                  </Text>
                  <Text variant="bodySmall" style={styles.listItemMeta}>
                    {entry.loanCount} {t('history.loans')}
                  </Text>
                </View>
                <View style={[styles.trustBadge, getTrustBadgeStyle(entry.trustScore)]}>
                  <Text
                    variant="labelSmall"
                    style={[styles.trustText, getTrustTextStyle(entry.trustScore)]}
                  >
                    {entry.trustScore}%
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Most loaned items section */}
      {mostLoanedItems.length > 0 && (
        <>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            {t('history.mostLoanedItems')}
          </Text>
          <View style={styles.listSection}>
            {mostLoanedItems.slice(0, 3).map((entry, index) => (
              <View key={entry.item.id} style={styles.listItem}>
                <View style={styles.rankBadge}>
                  <Text variant="labelMedium" style={styles.rankText}>
                    {index + 1}
                  </Text>
                </View>
                <View style={styles.listItemInfo}>
                  <Text variant="bodyLarge" style={styles.listItemName} numberOfLines={1}>
                    {entry.item.name}
                  </Text>
                  <Text variant="bodySmall" style={styles.listItemMeta}>
                    {entry.loanCount} {t('history.loans')}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Quick actions */}
      <View style={styles.actions}>
        <Button
          mode="outlined"
          icon="archive-outline"
          onPress={() => navigation.navigate('History')}
          style={styles.actionButton}
          textColor="#6B8E7B"
          testID="nav-history"
        >
          {t('history.archivedLoans')}
        </Button>
        <Button
          mode="outlined"
          icon="chart-bar"
          onPress={() => navigation.navigate('Statistics')}
          style={styles.actionButton}
          textColor="#6B8E7B"
          testID="nav-statistics"
        >
          {t('history.statistics')}
        </Button>
      </View>
    </ScrollView>
  );
}

// Helper to determine trust badge background color
function getTrustBadgeStyle(score: number) {
  if (score >= 80) return { backgroundColor: '#D0E4DB' };
  if (score >= 50) return { backgroundColor: '#FFF3E0' };
  return { backgroundColor: '#FAEAE7' };
}

// Helper to determine trust badge text color
function getTrustTextStyle(score: number) {
  if (score >= 80) return { color: '#4A6355' };
  if (score >= 50) return { color: '#E65100' };
  return { color: '#9B4E44' };
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F4EF' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 },
  emptyState: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: { color: '#2D3748', fontWeight: '600', marginTop: 16 },
  emptySubtitle: { color: '#6B7A8D', marginTop: 8, textAlign: 'center' },
  sectionTitle: {
    color: '#2D3748',
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 12,
  },
  grid: { gap: 0 },
  gridRow: { flexDirection: 'row', marginBottom: 4 },
  listSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EDE9E2',
    overflow: 'hidden',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EDE9E2',
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D0E4DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankText: { color: '#4A6355', fontWeight: '700' },
  listItemInfo: { flex: 1 },
  listItemName: { color: '#2D3748', fontWeight: '600' },
  listItemMeta: { color: '#6B7A8D', marginTop: 2 },
  trustBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  trustText: { fontWeight: '700' },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  actionButton: {
    flex: 1,
    borderColor: '#6B8E7B',
    borderRadius: 12,
  },
});
