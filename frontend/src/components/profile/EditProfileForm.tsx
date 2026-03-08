import { useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, HelperText, Text } from 'react-native-paper';
import PhoneInput from 'react-native-phone-number-input';
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
  const phoneRef = useRef<PhoneInput>(null);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateProfileDto>({
    defaultValues: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone ?? '',
    },
  });

  return (
    <View style={styles.container}>
      <Controller
        control={control}
        name="firstName"
        rules={{
          required: t('auth.firstNameRequired'),
          maxLength: { value: 50, message: t('auth.nameMaxLength') },
        }}
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
        rules={{
          required: t('auth.lastNameRequired'),
          maxLength: { value: 50, message: t('auth.nameMaxLength') },
        }}
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

      <Controller
        control={control}
        name="email"
        rules={{
          pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: t('auth.emailInvalid') },
        }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label={t('auth.email')}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            left={<TextInput.Icon icon="email-outline" color="#A8B5BF" />}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={!!errors.email}
            testID="email-input"
            style={[styles.input, ui.input]}
            outlineStyle={styles.outline}
          />
        )}
      />
      {errors.email && (
        <HelperText type="error" testID="email-error">
          {errors.email.message}
        </HelperText>
      )}

      <Text variant="labelMedium" style={styles.phoneLabel}>
        {t('profile.phone')}
      </Text>
      <Controller
        control={control}
        name="phone"
        rules={{
          pattern: {
            value: /^\+[1-9]\d{6,14}$/,
            message: t('profile.phoneInvalidFormat'),
          },
        }}
        render={({ field: { onChange } }) => (
          <PhoneInput
            ref={phoneRef}
            defaultCode="FR"
            layout="first"
            onChangeFormattedText={(text) => {
              onChange(text || undefined);
            }}
            containerStyle={styles.phoneContainer}
            textContainerStyle={styles.phoneTextContainer}
          />
        )}
      />
      {errors.phone && (
        <HelperText type="error" testID="phone-error">
          {errors.phone.message}
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
  phoneLabel: { color: '#A8B5BF', marginBottom: 6, marginTop: 4 },
  phoneContainer: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#C9C4BB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  phoneTextContainer: {
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  button: { marginTop: 20, borderRadius: 12 },
  buttonLabel: { fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  buttonContent: { paddingVertical: 8, flexDirection: 'row-reverse' },
});
