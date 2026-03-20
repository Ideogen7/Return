import { useEffect, useRef } from 'react';
import { ActivityIndicator, AppState, StyleSheet, View } from 'react-native';
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

  // Init / cleanup notifications on auth changes
  const deviceTokenRef = useRef<string | null>(null);

  useEffect(() => {
    const store = useNotificationStore.getState();

    if (isAuthenticated) {
      setupNotificationHandler();
      registerForPushNotifications()
        .then((token) => {
          deviceTokenRef.current = token;
        })
        .catch(() => {});
      store.fetchNotifications().catch(() => {});
    } else {
      if (deviceTokenRef.current) {
        store.unregisterDeviceToken(deviceTokenRef.current).catch(() => {});
        deviceTokenRef.current = null;
      }
      store.reset();
    }
  }, [isAuthenticated]);

  // Poll unread count every 30s to keep the badge up to date
  // Pause polling when app is in background to save battery
  useEffect(() => {
    if (!isAuthenticated) return;

    let interval: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (!interval) {
        interval = setInterval(() => {
          useNotificationStore.getState().fetchUnreadCount();
        }, 30_000);
      }
    };

    const stop = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    start();

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        useNotificationStore.getState().fetchUnreadCount();
        start();
      } else {
        stop();
      }
    });

    return () => {
      stop();
      subscription.remove();
    };
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
