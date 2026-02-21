import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { lightTheme } from './src/config/theme.config';
import { RootNavigator } from './src/navigation/RootNavigator';
import './src/config/i18n.config';

const navTheme = {
  dark: false,
  colors: {
    primary: lightTheme.colors.primary,
    background: lightTheme.colors.background,
    card: '#FFFFFF',
    text: lightTheme.colors.onSurface,
    border: '#e5e7eb',
    notification: lightTheme.colors.error,
  },
  fonts: NavigationContainer.defaultProps?.theme?.fonts ?? {},
};

export default function App() {
  return (
    <PaperProvider theme={lightTheme}>
      <NavigationContainer theme={navTheme as never}>
        <RootNavigator />
        <StatusBar style="dark" />
      </NavigationContainer>
    </PaperProvider>
  );
}
