import { useEffect } from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
import { Text, Button, Chip, ActivityIndicator, Icon } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { ui } from '../../config/theme.config';
import { useContactInvitationStore } from '../../stores/useContactInvitationStore';
import type { InvitationStatus } from '../../types/api.types';

const STATUS_STYLES: Record<InvitationStatus, { bg: string; text: string }> = {
  PENDING: { bg: '#FDE8D0', text: '#D97A6B' },
  ACCEPTED: { bg: '#D0E4DB', text: '#4A6355' },
  REJECTED: { bg: '#F5D5D5', text: '#C0392B' },
  EXPIRED: { bg: '#EDE9E2', text: '#6B7A8D' },
};

const STATUS_LABELS: Record<InvitationStatus, string> = {
  PENDING: 'invitations.statusPending',
  ACCEPTED: 'invitations.statusAccepted',
  REJECTED: 'invitations.statusRejected',
  EXPIRED: 'invitations.statusExpired',
};

export function SentInvitationsScreen() {
  const { t } = useTranslation();
  const { sentInvitations, isLoading, fetchSentInvitations, cancelInvitation } =
    useContactInvitationStore();

  useEffect(() => {
    fetchSentInvitations().catch(() => {});
  }, [fetchSentInvitations]);

  if (isLoading && sentInvitations.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6B8E7B" testID="loading" />
      </View>
    );
  }

  return (
    <View style={styles.container} testID="sent-invitations-screen">
      <FlatList
        data={sentInvitations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const statusStyle = STATUS_STYLES[item.status];
          return (
            <View style={[styles.card, ui.card]} testID={`sent-invitation-${item.id}`}>
              <View style={styles.info}>
                <Text variant="bodyLarge" style={styles.name}>
                  {item.recipientUser.firstName} {item.recipientUser.lastName}
                </Text>
                <Text variant="bodySmall" style={styles.email}>
                  {item.recipientEmail}
                </Text>
              </View>
              <View style={styles.actions}>
                <Chip
                  textStyle={{ color: statusStyle.text }}
                  style={{ backgroundColor: statusStyle.bg }}
                  testID={`status-chip-${item.id}`}
                >
                  {t(STATUS_LABELS[item.status])}
                </Chip>
                {item.status === 'PENDING' && (
                  <Button
                    mode="outlined"
                    compact
                    onPress={() => cancelInvitation(item.id).catch(() => {})}
                    style={styles.cancelBtn}
                    testID={`cancel-${item.id}`}
                  >
                    {t('invitations.cancel')}
                  </Button>
                )}
              </View>
            </View>
          );
        }}
        contentContainerStyle={
          sentInvitations.length === 0 ? styles.emptyContainer : styles.listContent
        }
        ListEmptyComponent={
          <View style={styles.emptyState} testID="sent-invitations-empty">
            <Icon source="send-outline" size={64} color="#C9C4BB" />
            <Text variant="bodyMedium" style={styles.emptyText}>
              {t('invitations.emptySent')}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F4EF' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingTop: 12, paddingBottom: 24 },
  emptyContainer: { flexGrow: 1 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyText: { color: '#6B7A8D', marginTop: 12, textAlign: 'center' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  info: { flex: 1 },
  name: { color: '#2D3748', fontWeight: '600' },
  email: { color: '#6B7A8D', marginTop: 2 },
  actions: { alignItems: 'flex-end', gap: 6 },
  cancelBtn: { borderRadius: 12, borderColor: '#C9C4BB' },
});
