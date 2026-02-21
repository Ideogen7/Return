import { View, StyleSheet } from 'react-native';
import { TextInput, Button, HelperText } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ui } from '../../config/theme.config';

interface ChangePasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

interface ChangePasswordFormProps {
  onSubmit: (data: { currentPassword: string; newPassword: string }) => void;
  isLoading: boolean;
  error?: string;
}

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/;

export function ChangePasswordForm({ onSubmit, isLoading, error }: ChangePasswordFormProps) {
  const { t } = useTranslation();
  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ChangePasswordFormData>();

  const newPassword = watch('newPassword');

  const handleFormSubmit = (data: ChangePasswordFormData) => {
    onSubmit({ currentPassword: data.currentPassword, newPassword: data.newPassword });
  };

  return (
    <View style={styles.container}>
      <Controller
        control={control}
        name="currentPassword"
        rules={{ required: t('auth.passwordRequired') }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label={t('profile.currentPassword')}
            mode="outlined"
            secureTextEntry
            left={<TextInput.Icon icon="lock-outline" color="#9ca3af" />}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={!!errors.currentPassword}
            testID="currentPassword-input"
            style={[styles.input, ui.input]}
            outlineStyle={styles.outline}
          />
        )}
      />
      {errors.currentPassword && (
        <HelperText type="error" testID="currentPassword-error">
          {errors.currentPassword.message}
        </HelperText>
      )}

      <Controller
        control={control}
        name="newPassword"
        rules={{
          required: t('auth.passwordRequired'),
          minLength: { value: 8, message: t('auth.passwordMinLength') },
          pattern: { value: PASSWORD_REGEX, message: t('auth.passwordStrength') },
        }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label={t('profile.newPassword')}
            mode="outlined"
            secureTextEntry
            left={<TextInput.Icon icon="lock-plus-outline" color="#9ca3af" />}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={!!errors.newPassword}
            testID="newPassword-input"
            style={[styles.input, ui.input]}
            outlineStyle={styles.outline}
          />
        )}
      />
      {errors.newPassword && (
        <HelperText type="error" testID="newPassword-error">
          {errors.newPassword.message}
        </HelperText>
      )}

      <Controller
        control={control}
        name="confirmNewPassword"
        rules={{
          required: t('auth.confirmPasswordRequired'),
          validate: (value) => value === newPassword || t('auth.passwordsMismatch'),
        }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label={t('profile.confirmNewPassword')}
            mode="outlined"
            secureTextEntry
            left={<TextInput.Icon icon="lock-check-outline" color="#9ca3af" />}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={!!errors.confirmNewPassword}
            testID="confirmNewPassword-input"
            style={[styles.input, ui.input]}
            outlineStyle={styles.outline}
          />
        )}
      />
      {errors.confirmNewPassword && (
        <HelperText type="error" testID="confirmNewPassword-error">
          {errors.confirmNewPassword.message}
        </HelperText>
      )}

      {error && (
        <HelperText type="error" testID="form-error">
          {error}
        </HelperText>
      )}

      <Button
        mode="contained"
        icon="lock-reset"
        onPress={handleSubmit(handleFormSubmit)}
        loading={isLoading}
        disabled={isLoading}
        testID="changePassword-btn"
        style={styles.button}
        labelStyle={styles.buttonLabel}
        contentStyle={styles.buttonContent}
      >
        {t('profile.changePassword')}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  input: { marginBottom: 8 },
  outline: { borderRadius: 12 },
  button: { marginTop: 20, borderRadius: 12 },
  buttonLabel: { fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  buttonContent: { paddingVertical: 8, flexDirection: 'row-reverse' },
});
