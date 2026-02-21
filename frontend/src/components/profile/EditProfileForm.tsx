import { View, StyleSheet } from 'react-native';
import { TextInput, Button, HelperText } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ui } from '../../config/theme.config';
import type { User, UpdateProfileDto } from '../../types/api.types';

interface EditProfileFormProps {
  user: User;
  onSubmit: (data: UpdateProfileDto) => void;
  isLoading: boolean;
}

export function EditProfileForm({ user, onSubmit, isLoading }: EditProfileFormProps) {
  const { t } = useTranslation();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateProfileDto>({
    defaultValues: {
      firstName: user.firstName,
      lastName: user.lastName,
    },
  });

  return (
    <View style={styles.container}>
      <Controller
        control={control}
        name="firstName"
        rules={{ required: t('auth.firstNameRequired') }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label={t('auth.firstName')}
            mode="outlined"
            left={<TextInput.Icon icon="account-outline" color="#A8B5BF" />}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={!!errors.firstName}
            testID="firstName-input"
            style={[styles.input, ui.input]}
            outlineStyle={styles.outline}
          />
        )}
      />
      {errors.firstName && (
        <HelperText type="error" testID="firstName-error">
          {errors.firstName.message}
        </HelperText>
      )}

      <Controller
        control={control}
        name="lastName"
        rules={{ required: t('auth.lastNameRequired') }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label={t('auth.lastName')}
            mode="outlined"
            left={<TextInput.Icon icon="account-outline" color="#A8B5BF" />}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={!!errors.lastName}
            testID="lastName-input"
            style={[styles.input, ui.input]}
            outlineStyle={styles.outline}
          />
        )}
      />
      {errors.lastName && (
        <HelperText type="error" testID="lastName-error">
          {errors.lastName.message}
        </HelperText>
      )}

      <Button
        mode="contained"
        icon="content-save-outline"
        onPress={handleSubmit(onSubmit)}
        loading={isLoading}
        disabled={isLoading}
        testID="save-btn"
        style={styles.button}
        labelStyle={styles.buttonLabel}
        contentStyle={styles.buttonContent}
      >
        {t('common.save')}
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
