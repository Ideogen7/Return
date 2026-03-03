import { StyleSheet } from 'react-native';
import { Chip, Icon } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { STATUS_COLORS } from '../../config/theme.config';
import type { LoanStatus } from '../../types/api.types';

const STATUS_I18N: Record<LoanStatus, string> = {
  PENDING_CONFIRMATION: 'loans.statusPendingConfirmation',
  ACTIVE: 'loans.statusActive',
  ACTIVE_BY_DEFAULT: 'loans.statusActiveByDefault',
  CONTESTED: 'loans.statusContested',
  AWAITING_RETURN: 'loans.statusAwaitingReturn',
  RETURNED: 'loans.statusReturned',
  NOT_RETURNED: 'loans.statusNotReturned',
  ABANDONED: 'loans.statusAbandoned',
};

const STATUS_ICONS: Record<LoanStatus, string> = {
  PENDING_CONFIRMATION: 'clock-outline',
  ACTIVE: 'check-circle-outline',
  ACTIVE_BY_DEFAULT: 'check-circle-outline',
  CONTESTED: 'alert-circle-outline',
  AWAITING_RETURN: 'arrow-left-circle-outline',
  RETURNED: 'check-all',
  NOT_RETURNED: 'close-circle-outline',
  ABANDONED: 'cancel',
};

interface StatusBadgeProps {
  status: LoanStatus;
  size?: 'small' | 'medium';
}

export function StatusBadge({ status, size = 'medium' }: StatusBadgeProps) {
  const { t } = useTranslation();
  const color = STATUS_COLORS[status].light;

  return (
    <Chip
      icon={() => (
        <Icon source={STATUS_ICONS[status]} size={size === 'small' ? 14 : 18} color={color} />
      )}
      style={[styles.chip, { backgroundColor: `${color}18` }]}
      textStyle={[styles.text, { color }, size === 'small' && styles.textSmall]}
      compact={size === 'small'}
      testID={`status-badge-${status}`}
    >
      {t(STATUS_I18N[status])}
    </Chip>
  );
}

export { STATUS_I18N, STATUS_ICONS };

const styles = StyleSheet.create({
  chip: { alignSelf: 'flex-start' },
  text: { fontWeight: '600', fontSize: 13 },
  textSmall: { fontSize: 11 },
});
