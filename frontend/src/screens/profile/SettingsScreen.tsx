import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  Text,
  Switch,
  Button,
  ActivityIndicator,
  SegmentedButtons,
  Icon,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import i18n from '../../config/i18n.config';
import apiClient from '../../api/apiClient';
import { ui } from '../../config/theme.config';
import type { UserSettings } from '../../types/api.types';

export function SettingsScreen() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await apiClient.get<UserSettings>('/users/me/settings');
        // Synchronise la langue initiale avec i18n
        setSettings({ ...data, language: i18n.language as 'fr' | 'en' });
      } catch {
        // Erreur gérée par l'intercepteur
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setIsSaving(true);
    try {
      const { data } = await apiClient.patch<UserSettings>('/users/me/settings', settings);
      setSettings(data);
    } catch {
      // Erreur gérée par l'intercepteur
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !settings) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#4f46e5" testID="loading" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={[styles.settingsCard, ui.card]}>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Icon source="bell-outline" size={20} color="#818cf8" />
            <Text variant="bodyLarge" style={styles.label}>
              {t('settings.pushNotifications')}
            </Text>
          </View>
          <Switch
            value={settings.pushNotificationsEnabled}
            onValueChange={(value) => setSettings({ ...settings, pushNotificationsEnabled: value })}
            testID="push-switch"
            color="#4f46e5"
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Icon source="clock-outline" size={20} color="#818cf8" />
            <Text variant="bodyLarge" style={styles.label}>
              {t('settings.reminders')}
            </Text>
          </View>
          <Switch
            value={settings.reminderEnabled}
            onValueChange={(value) => setSettings({ ...settings, reminderEnabled: value })}
            testID="reminder-switch"
            color="#4f46e5"
          />
        </View>
      </View>

      <View style={[styles.settingsCard, ui.card]}>
        <View style={styles.sectionHeader}>
          <Icon source="translate" size={20} color="#818cf8" />
          <Text variant="bodyLarge" style={styles.sectionLabel}>
            {t('settings.language')}
          </Text>
        </View>
        <SegmentedButtons
          value={settings.language}
          onValueChange={(value) => {
            const lang = value as 'fr' | 'en';
            setSettings({ ...settings, language: lang });
            i18n.changeLanguage(lang);
          }}
          buttons={[
            { value: 'fr', label: 'Français' },
            { value: 'en', label: 'English' },
          ]}
          style={styles.segmented}
        />
      </View>

      <Button
        mode="contained"
        icon="content-save-outline"
        onPress={handleSave}
        loading={isSaving}
        disabled={isSaving}
        testID="save-settings-btn"
        style={styles.button}
        labelStyle={styles.buttonLabel}
        contentStyle={styles.buttonContent}
      >
        {t('common.save')}
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 16, gap: 16, backgroundColor: '#f9fafb' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  settingsCard: { padding: 16 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  divider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginVertical: 4,
  },
  label: { color: '#1f2937' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  sectionLabel: { color: '#1f2937' },
  segmented: { marginTop: 4 },
  button: { marginTop: 8, borderRadius: 12 },
  buttonLabel: { fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  buttonContent: { paddingVertical: 8, flexDirection: 'row-reverse' },
});
