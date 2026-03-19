import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import i18n from '../config/i18n.config';
import { useAuthStore } from '../stores/useAuthStore';
import { useNotificationStore } from '../stores/useNotificationStore';
import {
  registerForPushNotifications,
  setupNotificationHandler,
} from '../services/pushNotifications';
import { AuthNavigator } from './AuthNavigator';
import { AppNavigator } from './AppNavigator';

export function RootNavigator() {
  const { isAuthenticated, isLoading, user, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Synchronise i18n avec la langue sauvegardée côté serveur
  useEffect(() => {
    if (user?.settings?.language && user.settings.language !== i18n.language) {
      i18n.changeLanguage(user.settings.language);
    }
  }, [user?.settings?.language]);

  // Init notifications when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    setupNotificationHandler();
    registerForPushNotifications().catch(() => {});
    useNotificationStore
      .getState()
      .fetchNotifications()
      .catch(() => {});
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <View style={styles.splash} testID="splash-screen">
        <ActivityIndicator size="large" color="#6B8E7B" />
      </View>
    );
  }

  return isAuthenticated ? <AppNavigator /> : <AuthNavigator />;
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F4EF',
  },
});
