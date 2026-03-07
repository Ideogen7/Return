import { useEffect } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Badge, Button, FAB, Icon, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BorrowerCard } from '../../components/borrowers/BorrowerCard';
import { useBorrowerStore } from '../../stores/useBorrowerStore';
import { useContactInvitationStore } from '../../stores/useContactInvitationStore';
import type { BorrowerStackParamList } from '../../navigation/types';
import type { Borrower } from '../../types/api.types';

type Props = NativeStackScreenProps<BorrowerStackParamList, 'BorrowerList'>;

export function BorrowerListScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { borrowers, isLoading, error, fetchBorrowers } = useBorrowerStore();
  const { pendingCount, fetchReceivedInvitations } = useContactInvitationStore();

  useEffect(() => {
    fetchBorrowers().catch(() => {});
    fetchReceivedInvitations().catch(() => {});
  }, [fetchBorrowers, fetchReceivedInvitations]);

  const handlePress = (id: string) => {
    navigation.navigate('BorrowerDetail', { id });
  };

  if (isLoading && borrowers.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6B8E7B" testID="loading" />
      </View>
    );
  }

  if (error && borrowers.length === 0) {
    return (
      <View style={styles.centerContainer} testID="borrower-error">
        <Icon source="alert-circle-outline" size={64} color="#D97A6B" />
        <Text variant="titleMedium" style={styles.emptyTitle}>
          {t('errors.unknownError')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container} testID="borrower-list">
      <View style={styles.invitationLinks}>
        <Button
          mode="text"
          icon="email-outline"
          onPress={() => navigation.navigate('BorrowerInvitations')}
          testID="received-invitations-link"
          contentStyle={styles.linkContent}
        >
          {t('invitations.receivedTitle')}
          {pendingCount > 0 && (
            <Badge size={18} style={styles.badge}>
              {pendingCount}
            </Badge>
          )}
        </Button>
        <Button
          mode="text"
          icon="send-outline"
          onPress={() => navigation.navigate('SentInvitations')}
          testID="sent-invitations-link"
          contentStyle={styles.linkContent}
        >
          {t('invitations.sentTitle')}
        </Button>
      </View>
      <FlatList<Borrower>
        data={borrowers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <BorrowerCard borrower={item} onPress={handlePress} />}
        contentContainerStyle={borrowers.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState} testID="borrower-empty">
            <Icon source="account-group-outline" size={64} color="#C9C4BB" />
            <Text variant="titleMedium" style={styles.emptyTitle}>
              {t('borrowers.emptyList')}
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtitle}>
              {t('borrowers.emptyListSubtitle')}
            </Text>
          </View>
        }
      />
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('SearchBorrower')}
        testID="add-borrower-fab"
        color="#FFFFFF"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F4EF' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingTop: 12, paddingBottom: 80 },
  emptyContainer: { flexGrow: 1 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyTitle: { color: '#2D3748', fontWeight: '600', marginTop: 16 },
  emptySubtitle: { color: '#6B7A8D', marginTop: 8, textAlign: 'center' },
  invitationLinks: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  linkContent: { flexDirection: 'row-reverse' },
  badge: { backgroundColor: '#D97A6B', marginLeft: 6 },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#6B8E7B',
    borderRadius: 16,
  },
});
