import { useEffect, useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import {
  Text,
  Button,
  ActivityIndicator,
  Portal,
  Dialog,
  HelperText,
  TextInput,
  Icon,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { DatePickerInput } from 'react-native-paper-dates';
import i18n from '../../config/i18n.config';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LoanTimeline } from '../../components/loans/LoanTimeline';
import { CATEGORY_I18N } from '../../components/items/ItemCard';
import { useLoanStore } from '../../stores/useLoanStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { parseProblemDetails, getErrorMessage } from '../../utils/error';
import { ui } from '../../config/theme.config';
import type { LoanStackParamList } from '../../navigation/types';
import type { AxiosError } from 'axios';

type Props = NativeStackScreenProps<LoanStackParamList, 'LoanDetail'>;

const EDITABLE_STATUSES = [
  'PENDING_CONFIRMATION',
  'ACTIVE',
  'ACTIVE_BY_DEFAULT',
  'AWAITING_RETURN',
  'CONTESTED',
];
const RETURNABLE_STATUSES = ['ACTIVE', 'ACTIVE_BY_DEFAULT', 'AWAITING_RETURN'];
const ABANDONABLE_STATUSES = ['ACTIVE', 'ACTIVE_BY_DEFAULT', 'AWAITING_RETURN'];

export function LoanDetailScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const { t } = useTranslation();
  const { selectedLoan, isLoading, error, fetchLoan } = useLoanStore();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [abandonDialogVisible, setAbandonDialogVisible] = useState(false);
  const [returnDialogVisible, setReturnDialogVisible] = useState(false);
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [editNotes, setEditNotes] = useState('');
  const [editReturnDate, setEditReturnDate] = useState('');
  const [editReturnDateObj, setEditReturnDateObj] = useState<Date | undefined>();
  const [apiError, setApiError] = useState<string | undefined>();

  useEffect(() => {
    fetchLoan(id).catch(() => {});
  }, [id, fetchLoan]);

  const handleDelete = async () => {
    setDeleteDialogVisible(false);
    setApiError(undefined);
    try {
      await useLoanStore.getState().deleteLoan(id);
      navigation.goBack();
    } catch (err) {
      const problem = parseProblemDetails(err as AxiosError);
      setApiError(problem ? getErrorMessage(problem, t) : t('errors.unknownError'));
    }
  };

  const handleAbandon = async () => {
    setAbandonDialogVisible(false);
    setApiError(undefined);
    try {
      await useLoanStore.getState().updateStatus(id, { status: 'ABANDONED' });
    } catch (err) {
      const problem = parseProblemDetails(err as AxiosError);
      setApiError(problem ? getErrorMessage(problem, t) : t('errors.unknownError'));
    }
  };

  const handleReturn = async () => {
    setReturnDialogVisible(false);
    setApiError(undefined);
    try {
      await useLoanStore.getState().updateStatus(id, { status: 'RETURNED' });
    } catch (err) {
      const problem = parseProblemDetails(err as AxiosError);
      setApiError(problem ? getErrorMessage(problem, t) : t('errors.unknownError'));
    }
  };

  const handleEdit = async () => {
    setEditDialogVisible(false);
    setApiError(undefined);
    try {
      await useLoanStore.getState().updateLoan(id, {
        notes: editNotes || null,
        returnDate: editReturnDate || null,
      });
    } catch (err) {
      const problem = parseProblemDetails(err as AxiosError);
      setApiError(problem ? getErrorMessage(problem, t) : t('errors.unknownError'));
    }
  };

  const openEditDialog = () => {
    setEditNotes(selectedLoan?.notes ?? '');
    const existingDate = selectedLoan?.returnDate ?? '';
    setEditReturnDate(existingDate);
    setEditReturnDateObj(existingDate ? new Date(existingDate) : undefined);
    setEditDialogVisible(true);
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6B8E7B" testID="loading" />
      </View>
    );
  }

  if (!selectedLoan) {
    return (
      <View style={styles.centerContainer} testID="loan-error">
        <Text variant="titleMedium" style={styles.errorText}>
          {error?.type?.includes('loan-not-found')
            ? t('errors.loanNotFound')
            : t('errors.unknownError')}
        </Text>
        <Button mode="outlined" onPress={() => navigation.goBack()} style={styles.backButton}>
          {t('common.back')}
        </Button>
      </View>
    );
  }

  const isLender = selectedLoan.lender.id === currentUserId;

  const canEdit = isLender && EDITABLE_STATUSES.includes(selectedLoan.status);
  const canReturn = isLender && RETURNABLE_STATUSES.includes(selectedLoan.status);
  const canAbandon = isLender && ABANDONABLE_STATUSES.includes(selectedLoan.status);
  const canDelete = isLender && selectedLoan.status !== 'RETURNED';
  const canConfirm = !isLender && selectedLoan.status === 'PENDING_CONFIRMATION';

  return (
    <ScrollView contentContainerStyle={styles.container} testID="loan-detail">
      {/* Info card */}
      <View style={[styles.infoCard, ui.card]}>
        <View style={styles.header}>
          <Icon source="handshake-outline" size={32} color="#4A6355" />
          <Text variant="headlineSmall" style={styles.name}>
            {selectedLoan.item.name}
          </Text>
        </View>

        <View style={styles.field}>
          <Text variant="labelMedium" style={styles.label}>
            {t('items.category')}
          </Text>
          <Text variant="bodyMedium" style={styles.value}>
            {t(CATEGORY_I18N[selectedLoan.item.category])}
          </Text>
        </View>

        <View style={styles.field}>
          <Text variant="labelMedium" style={styles.label}>
            {t('navigation.contacts')}
          </Text>
          <Text variant="bodyMedium" style={styles.value}>
            {selectedLoan.borrower.firstName} {selectedLoan.borrower.lastName}
          </Text>
        </View>

        {selectedLoan.returnDate && (
          <View style={styles.field}>
            <Text variant="labelMedium" style={styles.label}>
              {t('loans.returnDate')}
            </Text>
            <Text variant="bodyMedium" style={styles.value}>
              {new Date(selectedLoan.returnDate).toLocaleDateString()}
            </Text>
          </View>
        )}

        {selectedLoan.notes && (
          <View style={styles.field}>
            <Text variant="labelMedium" style={styles.label}>
              {t('loans.notes')}
            </Text>
            <Text variant="bodyMedium" style={styles.value}>
              {selectedLoan.notes}
            </Text>
          </View>
        )}

        {selectedLoan.contestReason && (
          <View style={styles.field}>
            <Text variant="labelMedium" style={styles.label}>
              {t('loans.contestReason')}
            </Text>
            <Text variant="bodyMedium" style={styles.contestValue}>
              {selectedLoan.contestReason}
            </Text>
          </View>
        )}
      </View>

      {/* Timeline */}
      <View style={[styles.timelineCard, ui.card]}>
        <LoanTimeline loan={selectedLoan} />
      </View>

      {apiError && (
        <HelperText type="error" testID="api-error" style={styles.apiError}>
          {apiError}
        </HelperText>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        {canConfirm && (
          <View style={styles.confirmRow}>
            <Button
              mode="contained"
              icon="check"
              onPress={() => navigation.navigate('ConfirmLoan', { id })}
              style={[styles.primaryButton, styles.confirmBtn]}
              labelStyle={styles.buttonLabel}
              contentStyle={styles.buttonContent}
              testID="confirm-loan-btn"
            >
              {t('loans.confirmLoan')}
            </Button>
            <Button
              mode="outlined"
              icon="close"
              onPress={() => navigation.navigate('ConfirmLoan', { id })}
              style={[styles.dangerButton, styles.contestBtn]}
              textColor="#D97A6B"
              labelStyle={styles.buttonLabel}
              contentStyle={styles.buttonContent}
              testID="contest-loan-btn"
            >
              {t('loans.contestLoan')}
            </Button>
          </View>
        )}

        {canReturn && (
          <Button
            mode="contained"
            icon="check-all"
            onPress={() => setReturnDialogVisible(true)}
            style={styles.primaryButton}
            labelStyle={styles.buttonLabel}
            contentStyle={styles.buttonContent}
            testID="return-loan-btn"
          >
            {t('loans.returnLoan')}
          </Button>
        )}

        {canEdit && (
          <Button
            mode="outlined"
            icon="pencil-outline"
            onPress={openEditDialog}
            style={styles.outlinedButton}
            labelStyle={styles.buttonLabel}
            contentStyle={styles.buttonContent}
            testID="edit-loan-btn"
          >
            {t('loans.editLoan')}
          </Button>
        )}

        {canAbandon && (
          <Button
            mode="outlined"
            icon="cancel"
            onPress={() => setAbandonDialogVisible(true)}
            style={styles.dangerButton}
            textColor="#D97A6B"
            labelStyle={styles.buttonLabel}
            contentStyle={styles.buttonContent}
            testID="abandon-loan-btn"
          >
            {t('loans.abandonLoan')}
          </Button>
        )}

        {canDelete && (
          <Button
            mode="outlined"
            icon="trash-can-outline"
            onPress={() => setDeleteDialogVisible(true)}
            style={styles.dangerButton}
            textColor="#D97A6B"
            labelStyle={styles.buttonLabel}
            contentStyle={styles.buttonContent}
            testID="delete-loan-btn"
          >
            {t('loans.deleteLoan')}
          </Button>
        )}
      </View>

      <Portal>
        {/* Delete dialog */}
        <Dialog
          visible={deleteDialogVisible}
          onDismiss={() => setDeleteDialogVisible(false)}
          testID="confirm-delete-dialog"
        >
          <Dialog.Title>{t('loans.confirmDelete')}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">{t('loans.deleteWarning')}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)} testID="cancel-delete-btn">
              {t('common.cancel')}
            </Button>
            <Button onPress={handleDelete} textColor="#D97A6B" testID="confirm-delete-btn">
              {t('common.delete')}
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Abandon dialog */}
        <Dialog
          visible={abandonDialogVisible}
          onDismiss={() => setAbandonDialogVisible(false)}
          testID="confirm-abandon-dialog"
        >
          <Dialog.Title>{t('loans.confirmAbandon')}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">{t('loans.abandonWarning')}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setAbandonDialogVisible(false)} testID="cancel-abandon-btn">
              {t('common.cancel')}
            </Button>
            <Button onPress={handleAbandon} textColor="#D97A6B" testID="confirm-abandon-btn">
              {t('common.confirm')}
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Return dialog */}
        <Dialog
          visible={returnDialogVisible}
          onDismiss={() => setReturnDialogVisible(false)}
          testID="confirm-return-dialog"
        >
          <Dialog.Title>{t('loans.confirmReturn')}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">{t('loans.returnWarning')}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setReturnDialogVisible(false)} testID="cancel-return-btn">
              {t('common.cancel')}
            </Button>
            <Button onPress={handleReturn} testID="confirm-return-btn">
              {t('common.confirm')}
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Edit dialog */}
        <Dialog
          visible={editDialogVisible}
          onDismiss={() => setEditDialogVisible(false)}
          testID="edit-loan-dialog"
        >
          <Dialog.Title>{t('loans.editLoan')}</Dialog.Title>
          <Dialog.Content>
            <DatePickerInput
              locale={i18n.language}
              label={t('loans.returnDate')}
              value={editReturnDateObj}
              onChange={(d) => {
                setEditReturnDateObj(d);
                setEditReturnDate(d ? d.toISOString().slice(0, 10) : '');
              }}
              inputMode="start"
              mode="outlined"
              testID="edit-return-date-input"
              style={styles.editInput}
            />
            <TextInput
              label={t('loans.notes')}
              value={editNotes}
              onChangeText={setEditNotes}
              multiline
              numberOfLines={3}
              testID="edit-notes-input"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setEditDialogVisible(false)} testID="cancel-edit-btn">
              {t('common.cancel')}
            </Button>
            <Button onPress={handleEdit} testID="confirm-edit-btn">
              {t('common.save')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingBottom: 32, backgroundColor: '#F7F4EF' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  errorText: { color: '#6B7A8D', textAlign: 'center', marginBottom: 16 },
  backButton: { borderRadius: 12 },
  infoCard: { margin: 16, padding: 24 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  name: { color: '#2D3748', fontWeight: '700', flex: 1 },
  field: { marginBottom: 12 },
  label: { color: '#A8B5BF', marginBottom: 2 },
  value: { color: '#2D3748' },
  timelineCard: { marginHorizontal: 16, marginBottom: 8 },
  apiError: { marginHorizontal: 16 },
  actions: { paddingHorizontal: 16, gap: 10, marginTop: 8 },
  primaryButton: { borderRadius: 12 },
  outlinedButton: { borderRadius: 12, borderColor: '#C9C4BB' },
  dangerButton: { borderRadius: 12, borderColor: '#FAEAE7' },
  buttonLabel: { fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },
  buttonContent: { paddingVertical: 6 },
  contestValue: { color: '#D97A6B' },
  editInput: { marginBottom: 12 },
  confirmRow: { flexDirection: 'row', gap: 10 },
  confirmBtn: { flex: 1, borderRadius: 12 },
  contestBtn: { flex: 1, borderRadius: 12, borderColor: '#FAEAE7' },
});
