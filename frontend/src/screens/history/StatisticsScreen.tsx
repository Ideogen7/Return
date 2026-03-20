import { useCallback } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Icon, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import { StatCard } from '../../components/history/StatCard';
import { useHistoryStore } from '../../stores/useHistoryStore';
import { CATEGORY_I18N } from '../../components/items/ItemCard';

export function StatisticsScreen() {
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

  if (!statistics) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.emptyState}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} colors={['#6B8E7B']} />
        }
        testID="statistics-screen"
      >
        <Icon source="chart-bar" size={64} color="#C9C4BB" />
        <Text variant="titleMedium" style={styles.emptyTitle}>
          {t('history.emptyStatistics')}
        </Text>
        <Text variant="bodyMedium" style={styles.emptySubtitle}>
          {t('history.emptyStatisticsSubtitle')}
        </Text>
      </ScrollView>
    );
  }

  const { overview, byCategory, topBorrowers, mostLoanedItems } = statistics;

  const formatDelay = (delay: number | null): string => {
    if (delay === null) return '-';
    return `${delay}${t('history.daysUnit')}`;
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} colors={['#6B8E7B']} />
      }
      testID="statistics-screen"
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
        <View style={styles.gridRow}>
          <StatCard
            title={t('history.contestedLoans')}
            value={overview.contestedLoans}
            icon="alert-circle-outline"
            color="#6B7A8D"
            testID="stat-contested-loans"
          />
          <StatCard
            title={t('history.averageReturnDelay')}
            value={formatDelay(overview.averageReturnDelay)}
            icon="timer-outline"
            color="#7BA692"
            testID="stat-avg-delay"
          />
        </View>
      </View>

      {/* By category section */}
      {byCategory.length > 0 && (
        <>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            {t('history.byCategory')}
          </Text>
          <View style={styles.listSection}>
            {byCategory.map((entry) => (
              <View key={entry.category} style={styles.listItem}>
                <View style={styles.listItemInfo}>
                  <Text variant="bodyLarge" style={styles.listItemName}>
                    {t(CATEGORY_I18N[entry.category])}
                  </Text>
                  <Text variant="bodySmall" style={styles.listItemMeta}>
                    {entry.count} {t('history.loans')}
                    {entry.totalValue !== null && ` — ${entry.totalValue}€`}
                  </Text>
                </View>
                <Text variant="titleMedium" style={styles.categoryCount}>
                  {entry.count}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Top borrowers section */}
      {topBorrowers.length > 0 && (
        <>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            {t('history.topBorrowers')}
          </Text>
          <View style={styles.listSection}>
            {topBorrowers.map((entry, index) => (
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
            {mostLoanedItems.map((entry, index) => (
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
  categoryCount: { color: '#6B8E7B', fontWeight: '700' },
  trustBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  trustText: { fontWeight: '700' },
});
