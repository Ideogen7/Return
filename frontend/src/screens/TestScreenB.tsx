import { View, StyleSheet } from 'react-native';
import { Text, Button, TextInput } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { useTestStore } from '../stores/useTestStore';

type Props = NativeStackScreenProps<RootStackParamList, 'ScreenB'>;

export function TestScreenB({ navigation }: Props) {
  const { count, increment, decrement } = useTestStore();

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium">Screen B</Text>
      <TextInput label="Test input" mode="outlined" style={styles.input} />
      <Text variant="bodyLarge">Count: {count}</Text>
      <View style={styles.row}>
        <Button mode="outlined" onPress={decrement}>
          -
        </Button>
        <Button mode="outlined" onPress={increment}>
          +
        </Button>
      </View>
      <Button mode="contained" onPress={() => navigation.goBack()} style={styles.button}>
        Go back to Screen A
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  input: { width: '80%', marginVertical: 12 },
  row: { flexDirection: 'row', gap: 12, marginVertical: 12 },
  button: { marginTop: 16 },
});
