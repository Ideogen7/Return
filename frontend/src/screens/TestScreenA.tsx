import { View, Text, Button, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'ScreenA'>;

export function TestScreenA({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Screen A</Text>
      <Button title="Go to Screen B" onPress={() => navigation.navigate('ScreenB')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, marginBottom: 16 },
});
