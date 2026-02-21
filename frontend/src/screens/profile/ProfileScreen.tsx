import { useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, ActivityIndicator } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProfileCard } from '../../components/profile/ProfileCard';
import { useAuthStore } from '../../stores/useAuthStore';
import type { AppStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'Profile'>;

export function ProfileScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { user, isLoading, logout } = useAuthStore();

  useEffect(() => {
    if (!user) {
      useAuthStore.getState().hydrate();
    }
  }, [user]);

  if (isLoading || !user) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#4f46e5" testID="loading" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ProfileCard user={user} />

      <View style={styles.actions}>
        <Button
          mode="contained"
          icon="account-edit-outline"
          onPress={() => navigation.navigate('EditProfile')}
          style={styles.primaryButton}
          labelStyle={styles.buttonLabel}
          contentStyle={styles.buttonContent}
          testID="edit-profile-btn"
        >
          {t('profile.editProfile')}
        </Button>

        <Button
          mode="outlined"
          icon="lock-outline"
          onPress={() => navigation.navigate('ChangePassword')}
          style={styles.outlinedButton}
          labelStyle={styles.outlinedLabel}
          contentStyle={styles.buttonContent}
          testID="change-password-btn"
        >
          {t('profile.changePassword')}
        </Button>

        <Button
          mode="outlined"
          icon="cog-outline"
          onPress={() => navigation.navigate('Settings')}
          style={styles.outlinedButton}
          labelStyle={styles.outlinedLabel}
          contentStyle={styles.buttonContent}
          testID="settings-btn"
        >
          {t('profile.settings')}
        </Button>

        <Button
          mode="outlined"
          icon="alert-circle-outline"
          onPress={() => navigation.navigate('DeleteAccount')}
          style={styles.dangerButton}
          textColor="#ef4444"
          labelStyle={styles.outlinedLabel}
          contentStyle={styles.buttonContent}
          testID="delete-account-btn"
        >
          {t('profile.deleteAccount')}
        </Button>

        <Button
          mode="text"
          icon="logout"
          onPress={logout}
          style={styles.logoutButton}
          textColor="#9ca3af"
          labelStyle={styles.logoutLabel}
          testID="logout-btn"
        >
          {t('auth.logout')}
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingBottom: 32, backgroundColor: '#f9fafb' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  actions: { paddingHorizontal: 16, gap: 10 },
  primaryButton: { borderRadius: 12 },
  buttonLabel: { fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },
  buttonContent: { paddingVertical: 6 },
  outlinedButton: { borderRadius: 12, borderColor: '#e5e7eb' },
  outlinedLabel: { fontSize: 15, fontWeight: '600', letterSpacing: 0.3 },
  dangerButton: { borderRadius: 12, borderColor: '#fee2e2' },
  logoutButton: { marginTop: 8 },
  logoutLabel: { fontSize: 14 },
});
