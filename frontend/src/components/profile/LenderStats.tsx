import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Icon, Divider } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import apiClient from '../../api/apiClient';
import type { Loan, PaginatedResponse } from '../../types/api.types';

const ACTIVE_STATUSES = new Set([
  'PENDING_CONFIRMATION',
  'ACTIVE',
  'ACTIVE_BY_DEFAULT',
  'CONTESTED',
  'AWAITING_RETURN',
]);

interface StatItem {
  icon: string;
  label: string;
  value: number | string;
  color: string;
}

interface LenderMetrics {
  totalLoans: number;
  activeLoans: number;
  returnedLoans: number;
  overdueLoans: number;
}

interface BorrowerMetrics {
  loansReceived: number;
  returnedOnTime: number;
  returnedLate: number;
  trustScore: number;
}

function computeLenderMetrics(loans: Loan[]): LenderMetrics {
  const now = new Date();
  return {
    totalLoans: loans.length,
    activeLoans: loans.filter((l) => ACTIVE_STATUSES.has(l.status)).length,
    returnedLoans: loans.filter((l) => l.status === 'RETURNED').length,
    overdueLoans: loans.filter((l) => {
      if (!ACTIVE_STATUSES.has(l.status)) return false;
      if (!l.returnDate) return false;
      return new Date(l.returnDate) < now;
    }).length,
  };
}

const COMPLETED_STATUSES = new Set(['RETURNED', 'NOT_RETURNED', 'ABANDONED']);

function computeBorrowerMetrics(loans: Loan[]): BorrowerMetrics {
  const completedLoans = loans.filter((l) => COMPLETED_STATUSES.has(l.status));
  const totalCompleted = completedLoans.length;
  const onTime = completedLoans.filter(
    (l) =>
      l.status === 'RETURNED' &&
      l.returnDate &&
      l.returnedDate &&
      new Date(l.returnedDate) <= new Date(l.returnDate),
  ).length;
  const late = completedLoans.filter(
    (l) =>
      l.status === 'RETURNED' &&
      l.returnDate &&
      l.returnedDate &&
      new Date(l.returnedDate) > new Date(l.returnDate),
  ).length;
  const score = totalCompleted > 0 ? Math.round((onTime * 100 + late * 50) / totalCompleted) : 0;
  return {
    loansReceived: loans.length,
    returnedOnTime: onTime,
    returnedLate: late,
    trustScore: score,
  };
}

async function fetchLoansForRole(role: 'lender' | 'borrower'): Promise<Loan[]> {
  const { data } = await apiClient.get<PaginatedResponse<Loan>>('/loans', {
    params: { role, includeArchived: true, limit: 100 },
  });
  return data.data;
}

export function LenderStats() {
  const { t } = useTranslation();
  const [lender, setLender] = useState<LenderMetrics>({
    totalLoans: 0,
    activeLoans: 0,
    returnedLoans: 0,
    overdueLoans: 0,
  });
  const [borrower, setBorrower] = useState<BorrowerMetrics>({
    loansReceived: 0,
    returnedOnTime: 0,
    returnedLate: 0,
    trustScore: 0,
  });

  useEffect(() => {
    fetchLoansForRole('lender')
      .then((loans) => setLender(computeLenderMetrics(loans)))
      .catch(() => {});
    fetchLoansForRole('borrower')
      .then((loans) => setBorrower(computeBorrowerMetrics(loans)))
      .catch(() => {});
  }, []);

  const lenderStatsData: StatItem[] = [
    {
      icon: 'handshake-outline',
      label: t('profile.totalLoans'),
      value: lender.totalLoans,
      color: '#4A6355',
    },
    {
      icon: 'clock-outline',
      label: t('profile.activeLoans'),
      value: lender.activeLoans,
      color: '#6B8E7B',
    },
    {
      icon: 'check-circle-outline',
      label: t('profile.returnedLoans'),
      value: lender.returnedLoans,
      color: '#7BAE8E',
    },
    {
      icon: 'alert-circle-outline',
      label: t('profile.overdueLoans'),
      value: lender.overdueLoans,
      color: '#D97A6B',
    },
  ];

  const borrowerStatsData: StatItem[] = [
    {
      icon: 'package-variant',
      label: t('profile.loansReceived'),
      value: borrower.loansReceived,
      color: '#4A6355',
    },
    {
      icon: 'check-circle-outline',
      label: t('profile.returnedOnTime'),
      value: borrower.returnedOnTime,
      color: '#7BAE8E',
    },
    {
      icon: 'clock-alert-outline',
      label: t('profile.returnedLate'),
      value: borrower.returnedLate,
      color: '#D97A6B',
    },
    {
      icon: 'shield-check-outline',
      label: t('profile.trustScore'),
      value: `${borrower.trustScore}%`,
      color: '#6B8E7B',
    },
  ];

  const renderStatRow = (stats: StatItem[]) => (
    <View style={styles.grid}>
      {stats.map((stat) => (
        <View key={stat.label} style={styles.statItem}>
          <Icon source={stat.icon} size={24} color={stat.color} />
          <Text variant="headlineSmall" style={[styles.statValue, { color: stat.color }]}>
            {stat.value}
          </Text>
          <Text variant="labelSmall" style={styles.statLabel}>
            {stat.label}
          </Text>
        </View>
      ))}
    </View>
  );

  return (
    <Card style={styles.card} testID="lender-stats">
      <Card.Content>
        <Text variant="titleMedium" style={styles.title}>
          {t('profile.statistics')}
        </Text>

        <Text variant="labelLarge" style={styles.sectionLabel}>
          {t('loans.myLoans')}
        </Text>
        {renderStatRow(lenderStatsData)}

        <Divider style={styles.divider} />

        <Text variant="labelLarge" style={styles.sectionLabel}>
          {t('loans.myBorrowings')}
        </Text>
        {renderStatRow(borrowerStatsData)}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginBottom: 16, borderRadius: 16, backgroundColor: '#FFFFFF' },
  title: { color: '#2D3748', fontWeight: '700', marginBottom: 12 },
  sectionLabel: { color: '#4A6355', fontWeight: '600', marginBottom: 8 },
  grid: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center', gap: 4 },
  statValue: { fontWeight: '700' },
  statLabel: { color: '#6B7A8D', textAlign: 'center' },
  divider: { marginVertical: 12 },
});
