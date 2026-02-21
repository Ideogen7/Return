import { View, StyleSheet } from 'react-native';
import { Text, Divider, Icon } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { ui } from '../../config/theme.config';
import type { User } from '../../types/api.types';

interface ProfileCardProps {
  user: User;
}

export function ProfileCard({ user }: ProfileCardProps) {
  const { t } = useTranslation();

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <View style={[styles.card, ui.card]} testID="profile-card">
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Icon source="account" size={32} color="#4f46e5" />
        </View>
        <View style={styles.headerText}>
          <Text variant="headlineSmall" style={styles.name} testID="profile-name">
            {user.firstName} {user.lastName}
          </Text>
          <Text variant="bodyMedium" style={styles.email} testID="profile-email">
            {user.email}
          </Text>
        </View>
      </View>

      <Divider style={styles.divider} />

      <View style={styles.row}>
        <View style={styles.rowLeft}>
          <Icon source="shield-account-outline" size={16} color="#9ca3af" />
          <Text variant="bodySmall" style={styles.label}>
            {t('profile.role')}
          </Text>
        </View>
        <Text variant="bodyMedium" style={styles.value}>
          {t('profile.lender')}
        </Text>
      </View>

      <View style={styles.row}>
        <View style={styles.rowLeft}>
          <Icon source="calendar-outline" size={16} color="#9ca3af" />
          <Text variant="bodySmall" style={styles.label}>
            {t('profile.memberSince')}
          </Text>
        </View>
        <Text variant="bodyMedium" style={styles.value}>
          {formatDate(user.createdAt)}
        </Text>
      </View>

      {user.lastLoginAt && (
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Icon source="clock-outline" size={16} color="#9ca3af" />
            <Text variant="bodySmall" style={styles.label}>
              {t('profile.lastLogin')}
            </Text>
          </View>
          <Text variant="bodyMedium" style={styles.value}>
            {formatDate(user.lastLoginAt)}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { margin: 16, padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  headerText: { flex: 1 },
  name: { color: '#111827', fontWeight: '700' },
  email: { color: '#6b7280', marginTop: 2 },
  divider: { marginVertical: 16, backgroundColor: '#e5e7eb' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { color: '#6b7280' },
  value: { color: '#374151', fontWeight: '500' },
});
