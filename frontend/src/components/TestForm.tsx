import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';

interface FormData {
  email: string;
  password: string;
}

export function TestForm({ onSubmit }: { onSubmit?: (data: FormData) => void }) {
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
          required: 'Email is required',
          pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' },
        }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            placeholder="Email"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            style={styles.input}
            testID="email-input"
          />
        )}
      />
      {errors.email ? <Text testID="email-error">{errors.email.message}</Text> : null}

      <Controller
        control={control}
        name="password"
        rules={{
          required: 'Password is required',
          minLength: { value: 8, message: 'Minimum 8 characters' },
        }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            placeholder="Password"
            secureTextEntry
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            style={styles.input}
            testID="password-input"
          />
        )}
      />
      {errors.password ? <Text testID="password-error">{errors.password.message}</Text> : null}

      <Button title="Submit" onPress={handleSubmit(onSubmit ?? (() => {}))} testID="submit-btn" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 8, marginBottom: 8, borderRadius: 4 },
});
