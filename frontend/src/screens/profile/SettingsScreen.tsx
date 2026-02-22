import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  Text,
  Switch,
  Button,
  ActivityIndicator,
  SegmentedButtons,
  TextInput,
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
        setSettings(data);
        // Synchronise i18n avec la langue du serveur
        i18n.changeLanguage(data.language);
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
      // Applique le changement de langue seulement après succès du PATCH
      i18n.changeLanguage(data.language);
    } catch {
      // Erreur gérée par l'intercepteur
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !settings) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#6B8E7B" testID="loading" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={[styles.settingsCard, ui.card]}>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Icon source="bell-outline" size={20} color="#4A6355" />
            <Text variant="bodyLarge" style={styles.label}>
              {t('settings.pushNotifications')}
            </Text>
          </View>
          <Switch
            value={settings.pushNotificationsEnabled}
            onValueChange={(value) => setSettings({ ...settings, pushNotificationsEnabled: value })}
            testID="push-switch"
            color="#6B8E7B"
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Icon source="clock-outline" size={20} color="#4A6355" />
            <Text variant="bodyLarge" style={styles.label}>
              {t('settings.reminders')}
            </Text>
          </View>
          <Switch
            value={settings.reminderEnabled}
            onValueChange={(value) => setSettings({ ...settings, reminderEnabled: value })}
            testID="reminder-switch"
            color="#6B8E7B"
          />
        </View>
      </View>

      <View style={[styles.settingsCard, ui.card]}>
        <View style={styles.sectionHeader}>
          <Icon source="translate" size={20} color="#4A6355" />
          <Text variant="bodyLarge" style={styles.sectionLabel}>
            {t('settings.language')}
          </Text>
        </View>
        <SegmentedButtons
          value={settings.language}
          onValueChange={(value) => {
            const lang = value as 'fr' | 'en';
            setSettings({ ...settings, language: lang });
          }}
          buttons={[
            { value: 'fr', label: 'Français' },
            { value: 'en', label: 'English' },
          ]}
          style={styles.segmented}
        />
      </View>

      <View style={[styles.settingsCard, ui.card]}>
        <View style={styles.sectionHeader}>
          <Icon source="earth" size={20} color="#4A6355" />
          <Text variant="bodyLarge" style={styles.sectionLabel}>
            {t('settings.timezone')}
          </Text>
        </View>
        <TextInput
          mode="outlined"
          value={settings.timezone}
          onChangeText={(value) => setSettings({ ...settings, timezone: value })}
          placeholder="Europe/Paris"
          left={<TextInput.Icon icon="map-clock-outline" color="#A8B5BF" />}
          testID="timezone-input"
          style={ui.input}
          outlineStyle={styles.outline}
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
  container: { flexGrow: 1, padding: 16, gap: 16, backgroundColor: '#F7F4EF' },
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
    backgroundColor: '#EDE9E2',
    marginVertical: 4,
  },
  label: { color: '#2D3748' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  sectionLabel: { color: '#2D3748' },
  segmented: { marginTop: 4 },
  outline: { borderRadius: 12 },
  button: { marginTop: 8, borderRadius: 12 },
  buttonLabel: { fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  buttonContent: { paddingVertical: 8, flexDirection: 'row-reverse' },
});
