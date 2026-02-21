import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { StyleSheet } from 'react-native';

// --- Palette Indigo/Gris (Tailwind CSS) ---
export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#4f46e5', // Indigo-600
    onPrimary: '#FFFFFF',
    primaryContainer: '#eef2ff', // Indigo-50
    onPrimaryContainer: '#312e81', // Indigo-900
    secondary: '#10b981', // Emerald-500
    onSecondary: '#FFFFFF',
    secondaryContainer: '#ecfdf5', // Emerald-50
    onSecondaryContainer: '#047857', // Emerald-700
    tertiary: '#f97316', // Orange-500
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#ffedd5', // Orange-100
    onTertiaryContainer: '#c2410c', // Orange-700
    error: '#ef4444', // Red-500
    onError: '#FFFFFF',
    errorContainer: '#fef2f2', // Red-50
    onErrorContainer: '#991b1b', // Red-800
    background: '#f9fafb', // Gray-50
    onBackground: '#111827', // Gray-900
    surface: '#FFFFFF',
    onSurface: '#111827', // Gray-900
    surfaceVariant: '#f3f4f6', // Gray-100
    onSurfaceVariant: '#6b7280', // Gray-500
    outline: '#d1d5db', // Gray-300
    elevation: {
      level0: 'transparent',
      level1: '#FFFFFF',
      level2: '#FFFFFF',
      level3: '#f3f4f6',
      level4: '#f3f4f6',
      level5: '#e5e7eb',
    },
  },
};

// --- Dark (fallback) ---
export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#818cf8', // Indigo-400
    onPrimary: '#FFFFFF',
    primaryContainer: '#312e81', // Indigo-900
    onPrimaryContainer: '#eef2ff', // Indigo-50
    secondary: '#34d399', // Emerald-400
    onSecondary: '#FFFFFF',
    secondaryContainer: '#047857',
    onSecondaryContainer: '#ecfdf5',
    tertiary: '#fb923c', // Orange-400
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#c2410c',
    onTertiaryContainer: '#ffedd5',
    error: '#f87171',
    onError: '#FFFFFF',
    errorContainer: '#991b1b',
    onErrorContainer: '#fef2f2',
    background: '#111827', // Gray-900
    onBackground: '#f9fafb',
    surface: '#1f2937', // Gray-800
    onSurface: '#f9fafb',
    surfaceVariant: '#374151', // Gray-700
    onSurfaceVariant: '#9ca3af', // Gray-400
    outline: '#4b5563', // Gray-600
    elevation: {
      level0: 'transparent',
      level1: '#1f2937',
      level2: '#1f2937',
      level3: '#374151',
      level4: '#374151',
      level5: '#4b5563',
    },
  },
};

// --- Styles réutilisables ---
export const ui = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6', // Gray-100
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
  PENDING_CONFIRMATION: { light: '#f97316', dark: '#fb923c' },
  ACTIVE: { light: '#10b981', dark: '#34d399' },
  ACTIVE_BY_DEFAULT: { light: '#14b8a6', dark: '#2dd4bf' },
  CONTESTED: { light: '#6b7280', dark: '#9ca3af' },
  AWAITING_RETURN: { light: '#ef4444', dark: '#f87171' },
  RETURNED: { light: '#4f46e5', dark: '#818cf8' },
  NOT_RETURNED: { light: '#dc2626', dark: '#ef4444' },
  ABANDONED: { light: '#9ca3af', dark: '#6b7280' },
} as const;
