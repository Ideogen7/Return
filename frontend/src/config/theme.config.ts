import { MD3LightTheme, MD3DarkTheme, configureFonts } from 'react-native-paper';
import { StyleSheet } from 'react-native';

const fontConfig = { fontFamily: 'Nunito_400Regular' };

// --- Palette Sage / Beige / Terracotta ---
export const lightTheme = {
  ...MD3LightTheme,
  fonts: configureFonts({ config: fontConfig }),
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6B8E7B', // Vert Sauge
    onPrimary: '#FFFFFF',
    primaryContainer: '#D0E4DB', // Sauge clair
    onPrimaryContainer: '#1A3329',
    secondary: '#D97A6B', // Terracotta
    onSecondary: '#FFFFFF',
    secondaryContainer: '#FAEAE7',
    onSecondaryContainer: '#9B4E44',
    tertiary: '#4A6355', // Sauge foncé
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#E8F2EE',
    onTertiaryContainer: '#1A3329',
    error: '#D97A6B', // Terracotta
    onError: '#FFFFFF',
    errorContainer: '#FAEAE7',
    onErrorContainer: '#9B4E44',
    background: '#F7F4EF', // Beige Sable
    onBackground: '#2D3748', // Gris Anthracite
    surface: '#FFFFFF',
    onSurface: '#2D3748',
    surfaceVariant: '#EDE9E2',
    onSurfaceVariant: '#6B7A8D',
    outline: '#C9C4BB',
    elevation: {
      level0: 'transparent',
      level1: '#FFFFFF',
      level2: '#FFFFFF',
      level3: '#EDE9E2',
      level4: '#EDE9E2',
      level5: '#C9C4BB',
    },
  },
};

// --- Dark (fallback) ---
export const darkTheme = {
  ...MD3DarkTheme,
  fonts: configureFonts({ config: fontConfig }),
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#A3C4B1',
    onPrimary: '#FFFFFF',
    primaryContainer: '#4A6355',
    onPrimaryContainer: '#D0E4DB',
    secondary: '#E8A89C',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#9B4E44',
    onSecondaryContainer: '#FAEAE7',
    tertiary: '#7BA692',
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#1A3329',
    onTertiaryContainer: '#E8F2EE',
    error: '#E8A89C',
    onError: '#FFFFFF',
    errorContainer: '#9B4E44',
    onErrorContainer: '#FAEAE7',
    background: '#1C1B1F',
    onBackground: '#E6E1E5',
    surface: '#1C1B1F',
    onSurface: '#E6E1E5',
    surfaceVariant: '#2D3748',
    onSurfaceVariant: '#A8B5BF',
    outline: '#4A5568',
    elevation: {
      level0: 'transparent',
      level1: '#1C1B1F',
      level2: '#1C1B1F',
      level3: '#2D3748',
      level4: '#2D3748',
      level5: '#4A5568',
    },
  },
};

// --- Styles réutilisables ---
export const ui = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EDE9E2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  input: {
    backgroundColor: '#FFFFFF',
  },
});

// --- Couleurs sémantiques — Statuts de prêt (Sprint 4) ---
export const STATUS_COLORS = {
  PENDING_CONFIRMATION: { light: '#D97A6B', dark: '#E8A89C' },
  ACTIVE: { light: '#6B8E7B', dark: '#A3C4B1' },
  ACTIVE_BY_DEFAULT: { light: '#7BA692', dark: '#A3C4B1' },
  CONTESTED: { light: '#6B7A8D', dark: '#A8B5BF' },
  AWAITING_RETURN: { light: '#C46A5D', dark: '#E8A89C' },
  RETURNED: { light: '#4A6355', dark: '#7BA692' },
  NOT_RETURNED: { light: '#9B4E44', dark: '#D97A6B' },
  ABANDONED: { light: '#A8B5BF', dark: '#6B7A8D' },
} as const;
