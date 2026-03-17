import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { STATUS_COLORS } from '../../config/theme.config';
import { StatusBadge } from './StatusBadge';
import type { Loan } from '../../types/api.types';

interface TimelineStep {
  label: string;
  date?: string | null;
  reached: boolean;
  variant?: 'default' | 'danger' | 'muted';
}

interface LoanTimelineProps {
  loan: Loan;
}

function formatDateRange(
  from: string | null | undefined,
  to: string | null | undefined,
): string | null {
  if (!from) return null;
  const f = new Date(from).toLocaleDateString();
  if (!to) return f;
  const t = new Date(to).toLocaleDateString();
  return f === t ? f : `${f} — ${t}`;
}

function getTimelineSteps(loan: Loan, t: (key: string) => string): TimelineStep[] {
  const activeLabel =
    loan.status === 'ACTIVE_BY_DEFAULT'
      ? t('loans.statusActiveByDefault')
      : t('loans.statusActive');

  // Active period: from confirmationDate to either returnDate, returnedDate, or updatedAt
  const activePeriodEnd = loan.returnedDate ?? loan.returnDate ?? loan.updatedAt;
  const activeDate = formatDateRange(loan.confirmationDate, activePeriodEnd);

  switch (loan.status) {
    case 'PENDING_CONFIRMATION':
      return [
        { label: t('loans.statusPendingConfirmation'), date: loan.createdAt, reached: true },
        { label: t('loans.statusActive'), reached: false },
        { label: t('loans.statusAwaitingReturn'), date: loan.returnDate, reached: false },
        { label: t('loans.statusReturned'), reached: false },
      ];

    case 'ACTIVE':
    case 'ACTIVE_BY_DEFAULT':
      return [
        { label: t('loans.statusPendingConfirmation'), date: loan.createdAt, reached: true },
        { label: activeLabel, date: activeDate, reached: true },
        { label: t('loans.statusAwaitingReturn'), date: loan.returnDate, reached: false },
        { label: t('loans.statusReturned'), reached: false },
      ];

    case 'CONTESTED':
      return [
        { label: t('loans.statusPendingConfirmation'), date: loan.createdAt, reached: true },
        {
          label: t('loans.statusContested'),
          date: loan.updatedAt,
          reached: true,
          variant: 'danger',
        },
      ];

    case 'AWAITING_RETURN':
      return [
        { label: t('loans.statusPendingConfirmation'), date: loan.createdAt, reached: true },
        { label: activeLabel, date: activeDate, reached: true },
        { label: t('loans.statusAwaitingReturn'), date: loan.returnDate, reached: true },
        { label: t('loans.statusReturned'), reached: false },
      ];

    case 'RETURNED':
      return [
        { label: t('loans.statusPendingConfirmation'), date: loan.createdAt, reached: true },
        { label: activeLabel, date: activeDate, reached: true },
        { label: t('loans.statusAwaitingReturn'), date: loan.returnDate, reached: true },
        { label: t('loans.statusReturned'), date: loan.returnedDate, reached: true },
      ];

    case 'ABANDONED':
      return [
        { label: t('loans.statusPendingConfirmation'), date: loan.createdAt, reached: true },
        { label: activeLabel, date: activeDate, reached: true },
        {
          label: t('loans.statusAbandoned'),
          date: loan.updatedAt,
          reached: true,
          variant: 'muted',
        },
      ];

    case 'NOT_RETURNED':
      return [
        { label: t('loans.statusPendingConfirmation'), date: loan.createdAt, reached: true },
        { label: activeLabel, date: activeDate, reached: true },
        { label: t('loans.statusAwaitingReturn'), date: loan.returnDate, reached: true },
        {
          label: t('loans.statusNotReturned'),
          date: loan.updatedAt,
          reached: true,
          variant: 'danger',
        },
      ];

    default:
      return [];
  }
}

export function LoanTimeline({ loan }: LoanTimelineProps) {
  const { t } = useTranslation();

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString();
  };

  // TODO Sprint 5 : ajouter les étapes de rappel (J+3, J+7, J+14, J+21) pour AWAITING_RETURN tardif
  const steps = getTimelineSteps(loan, t);

  const getDotStyle = (step: TimelineStep) => {
    if (!step.reached) return styles.dotUnreached;
    if (step.variant === 'danger') return styles.dotDanger;
    if (step.variant === 'muted') return styles.dotMuted;
    return styles.dotReached;
  };

  const getLabelStyle = (step: TimelineStep) => {
    if (!step.reached) return styles.stepLabel;
    if (step.variant === 'danger') return [styles.stepLabel, styles.stepLabelDanger];
    if (step.variant === 'muted') return [styles.stepLabel, styles.stepLabelMuted];
    return [styles.stepLabel, styles.stepLabelActive];
  };

  return (
    <View style={styles.container} testID="loan-timeline">
      <View style={styles.currentStatus}>
        <StatusBadge status={loan.status} />
      </View>

      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;

        return (
          <View key={`${step.label}-${index}`} style={styles.step}>
            <View style={styles.lineContainer}>
              <View style={[styles.dot, getDotStyle(step)]} />
              {!isLast && (
                <View
                  style={[styles.line, step.reached ? styles.lineReached : styles.lineUnreached]}
                />
              )}
            </View>
            <View style={styles.stepContent}>
              <Text variant="bodyMedium" style={getLabelStyle(step)}>
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
  dotReached: { backgroundColor: STATUS_COLORS.ACTIVE.light },
  dotUnreached: { backgroundColor: '#C9C4BB' },
  dotDanger: { backgroundColor: STATUS_COLORS.NOT_RETURNED.light },
  dotMuted: { backgroundColor: STATUS_COLORS.ABANDONED.light },
  line: { width: 2, flex: 1, marginVertical: 4 },
  lineReached: { backgroundColor: STATUS_COLORS.ACTIVE.light },
  lineUnreached: { backgroundColor: '#EDE9E2' },
  stepContent: { flex: 1, marginLeft: 12, paddingBottom: 12 },
  stepLabel: { color: '#A8B5BF' },
  stepLabelActive: { color: '#2D3748', fontWeight: '600' },
  stepLabelDanger: { color: STATUS_COLORS.NOT_RETURNED.light, fontWeight: '600' },
  stepLabelMuted: { color: STATUS_COLORS.ABANDONED.light, fontWeight: '600' },
  stepDate: { color: '#6B7A8D', marginTop: 2 },
});
