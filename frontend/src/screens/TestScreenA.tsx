import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'ScreenA'>;

export function TestScreenA({ navigation }: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium">Screen A</Text>
      <Text variant="bodyMedium">{t('common.loading')}</Text>
      <Button mode="contained" onPress={() => navigation.navigate('ScreenB')} style={styles.button}>
        Go to Screen B
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  button: { marginTop: 16 },
});
