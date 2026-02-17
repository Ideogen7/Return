import { View, StyleSheet } from 'react-native';
import { TextInput, Button, HelperText } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

interface FormData {
  email: string;
  password: string;
}

export function TestForm({ onSubmit }: { onSubmit?: (data: FormData) => void }) {
  const { t } = useTranslation();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  return (
    <View style={styles.container}>
      <Controller
        control={control}
        name="email"
        rules={{
          required: t('auth.emailRequired'),
          pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: t('auth.emailInvalid') },
        }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label={t('auth.email')}
            mode="outlined"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={!!errors.email}
            testID="email-input"
            style={styles.input}
          />
        )}
      />
      {errors.email ? (
        <HelperText type="error" testID="email-error">
          {errors.email.message}
        </HelperText>
      ) : null}

      <Controller
        control={control}
        name="password"
        rules={{
          required: t('auth.passwordRequired'),
          minLength: { value: 8, message: t('auth.passwordMinLength') },
        }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label={t('auth.password')}
            mode="outlined"
            secureTextEntry
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={!!errors.password}
            testID="password-input"
            style={styles.input}
          />
        )}
      />
      {errors.password ? (
        <HelperText type="error" testID="password-error">
          {errors.password.message}
        </HelperText>
      ) : null}

      <Button mode="contained" onPress={handleSubmit(onSubmit ?? (() => {}))} testID="submit-btn">
        {t('auth.submit')}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  input: { marginBottom: 4 },
});
