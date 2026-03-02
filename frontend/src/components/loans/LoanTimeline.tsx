import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { STATUS_COLORS } from '../../config/theme.config';
import { StatusBadge } from './StatusBadge';
import type { Loan, LoanStatus } from '../../types/api.types';

interface TimelineStep {
  label: string;
  date?: string | null;
  reached: boolean;
}

const REACHED_STATUSES: Record<LoanStatus, number> = {
  PENDING_CONFIRMATION: 0,
  ACTIVE: 1,
  ACTIVE_BY_DEFAULT: 1,
  CONTESTED: 1,
  AWAITING_RETURN: 2,
  RETURNED: 3,
  NOT_RETURNED: 3,
  ABANDONED: 3,
};

interface LoanTimelineProps {
  loan: Loan;
}

export function LoanTimeline({ loan }: LoanTimelineProps) {
  const { t } = useTranslation();

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString();
  };

  const currentStep = REACHED_STATUSES[loan.status];

  const steps: TimelineStep[] = [
    {
      label: t('loans.statusPendingConfirmation'),
      date: loan.createdAt,
      reached: currentStep >= 0,
    },
    { label: t('loans.statusActive'), date: loan.confirmationDate, reached: currentStep >= 1 },
    { label: t('loans.statusAwaitingReturn'), date: null, reached: currentStep >= 2 },
    { label: t('loans.statusReturned'), date: loan.returnedDate, reached: currentStep >= 3 },
  ];

  return (
    <View style={styles.container} testID="loan-timeline">
      <View style={styles.currentStatus}>
        <StatusBadge status={loan.status} />
      </View>

      {steps.map((step, index) => {
        const color = step.reached ? STATUS_COLORS.ACTIVE.light : '#C9C4BB';
        const isLast = index === steps.length - 1;

        return (
          <View key={step.label} style={styles.step}>
            <View style={styles.lineContainer}>
              <View style={[styles.dot, { backgroundColor: color }]} />
              {!isLast && (
                <View
                  style={[styles.line, { backgroundColor: step.reached ? color : '#EDE9E2' }]}
                />
              )}
            </View>
            <View style={styles.stepContent}>
              <Text
                variant="bodyMedium"
                style={[styles.stepLabel, step.reached && styles.stepLabelActive]}
              >
                {step.label}
              </Text>
              {step.date && (
                <Text variant="bodySmall" style={styles.stepDate}>
                  {formatDate(step.date)}
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  currentStatus: { marginBottom: 16 },
  step: { flexDirection: 'row', minHeight: 48 },
  lineContainer: { alignItems: 'center', width: 24 },
  dot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
  line: { width: 2, flex: 1, marginVertical: 4 },
  stepContent: { flex: 1, marginLeft: 12, paddingBottom: 12 },
  stepLabel: { color: '#A8B5BF' },
  stepLabelActive: { color: '#2D3748', fontWeight: '600' },
  stepDate: { color: '#6B7A8D', marginTop: 2 },
});
