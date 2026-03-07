import { View, StyleSheet } from 'react-native';
import { Text, Button, Chip, IconButton } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { ui } from '../../config/theme.config';
import type { UserSearchResult } from '../../types/api.types';

interface UserSearchResultItemProps {
  result: UserSearchResult;
  onInvite: (email: string) => void;
  onCancel: (id: string) => void;
}

export function UserSearchResultItem({ result, onInvite, onCancel }: UserSearchResultItemProps) {
  const { t } = useTranslation();

  return (
    <View style={[styles.card, ui.card]} testID={`search-result-${result.id}`}>
      <View style={styles.info}>
        <Text variant="bodyLarge" style={styles.name}>
          {result.firstName} {result.lastName}
        </Text>
        <Text variant="bodySmall" style={styles.email}>
          {result.email}
        </Text>
      </View>
      <View style={styles.action}>
        {result.alreadyContact ? (
          <Chip
            icon="check"
            textStyle={styles.contactChipText}
            style={styles.contactChip}
            testID="chip-contact"
          >
            {t('invitations.contact')}
          </Chip>
        ) : result.pendingInvitationId ? (
          <View style={styles.pendingRow}>
            <Chip
              textStyle={styles.pendingChipText}
              style={styles.pendingChip}
              testID="chip-pending"
            >
              {t('invitations.pending')}
            </Chip>
            <IconButton
              icon="close"
              size={18}
              onPress={() => onCancel(result.pendingInvitationId!)}
              testID="cancel-invitation-btn"
            />
          </View>
        ) : (
          <Button
            mode="outlined"
            compact
            onPress={() => onInvite(result.email)}
            testID="invite-btn"
            style={styles.inviteBtn}
          >
            {t('invitations.invite')}
          </Button>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  info: { flex: 1 },
  name: { color: '#2D3748', fontWeight: '600' },
  email: { color: '#6B7A8D', marginTop: 2 },
  action: { marginLeft: 8 },
  contactChip: { backgroundColor: '#D0E4DB' },
  contactChipText: { color: '#4A6355' },
  pendingChip: { backgroundColor: '#FDE8D0' },
  pendingChipText: { color: '#D97A6B' },
  pendingRow: { flexDirection: 'row', alignItems: 'center' },
  inviteBtn: { borderColor: '#6B8E7B', borderRadius: 12 },
});
