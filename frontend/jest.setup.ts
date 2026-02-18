// Jest setup file
// Les matchers RNTL sont intégrés automatiquement dans @testing-library/react-native v12+

// Mock AsyncStorage pour les tests
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Initialisation i18n pour tous les tests
import './src/config/i18n.config';
