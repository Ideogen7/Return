import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { lightTheme } from './src/config/theme.config';
import { RootNavigator } from './src/navigation/RootNavigator';
import './src/config/i18n.config';

export default function App() {
  return (
    <PaperProvider theme={lightTheme}>
      <NavigationContainer>
        <RootNavigator />
        <StatusBar style="auto" />
      </NavigationContainer>
    </PaperProvider>
  );
}
