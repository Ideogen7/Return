import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Icon } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useLoanStore } from '../../stores/useLoanStore';

const ACTIVE_STATUSES = new Set([
  'PENDING_CONFIRMATION',
  'ACTIVE',
  'ACTIVE_BY_DEFAULT',
  'AWAITING_RETURN',
]);

export function LenderStats() {
  const { t } = useTranslation();
  const loans = useLoanStore((s) => s.loans);

  useEffect(() => {
    useLoanStore
      .getState()
      .fetchLoans({ includeArchived: true })
      .catch(() => {});
  }, []);

  const totalLoans = loans.length;
  const activeLoans = loans.filter((l) => ACTIVE_STATUSES.has(l.status)).length;
  const returnedLoans = loans.filter((l) => l.status === 'RETURNED').length;
  const overdueLoans = loans.filter((l) => {
    if (!ACTIVE_STATUSES.has(l.status)) return false;
    if (!l.returnDate) return false;
    return new Date(l.returnDate) < new Date();
  }).length;

  const stats = [
    {
      icon: 'handshake-outline',
      label: t('profile.totalLoans'),
      value: totalLoans,
      color: '#4A6355',
    },
    {
      icon: 'clock-outline',
      label: t('profile.activeLoans'),
      value: activeLoans,
      color: '#6B8E7B',
    },
    {
      icon: 'check-circle-outline',
      label: t('profile.returnedLoans'),
      value: returnedLoans,
      color: '#7BAE8E',
    },
    {
      icon: 'alert-circle-outline',
      label: t('profile.overdueLoans'),
      value: overdueLoans,
      color: '#D97A6B',
    },
  ];

  return (
    <Card style={styles.card} testID="lender-stats">
      <Card.Content>
        <Text variant="titleMedium" style={styles.title}>
          {t('profile.statistics')}
        </Text>
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
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginBottom: 16, borderRadius: 16, backgroundColor: '#FFFFFF' },
  title: { color: '#2D3748', fontWeight: '700', marginBottom: 12 },
  grid: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center', gap: 4 },
  statValue: { fontWeight: '700' },
  statLabel: { color: '#6B7A8D', textAlign: 'center' },
});
