import { ScrollView, StyleSheet, View } from 'react-native';
import { Text, Button, Icon } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RegisterForm } from '../../components/auth/RegisterForm';
import { useAuthStore } from '../../stores/useAuthStore';
import { getErrorMessage } from '../../utils/error';
import type { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { isLoading, error, register } = useAuthStore();

  const handleSubmit = async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => {
    try {
      await register(data.email, data.password, data.firstName, data.lastName);
    } catch {
      // L'erreur est gérée par le store
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.logoRow}>
        <View style={styles.logoBadge}>
          <Icon source="undo-variant" size={24} color="#FFFFFF" />
        </View>
        <Text variant="headlineSmall" style={styles.logoText}>
          Return
        </Text>
      </View>

      <Text variant="titleLarge" style={styles.title}>
        {t('auth.registerTitle')}
      </Text>

      <RegisterForm
        onSubmit={handleSubmit}
        isLoading={isLoading}
        error={error ? getErrorMessage(error, t) : undefined}
      />

      <Button
        mode="text"
        onPress={() => navigation.navigate('Login')}
        testID="go-login"
        textColor="#6B8E7B"
        labelStyle={styles.linkLabel}
      >
        {t('auth.hasAccount')}
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 24, backgroundColor: '#F7F4EF' },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  logoBadge: {
    backgroundColor: '#6B8E7B',
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  logoText: { color: '#2D3748', fontWeight: '700', letterSpacing: -0.5 },
  title: { textAlign: 'center', marginBottom: 24, color: '#6B7A8D' },
  linkLabel: { fontSize: 14, letterSpacing: 0.3 },
});
