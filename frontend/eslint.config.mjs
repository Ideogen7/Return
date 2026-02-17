import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import reactNativePlugin from 'eslint-plugin-react-native';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  // Fichiers ignores
  {
    ignores: [
      'node_modules/',
      '.expo/',
      'dist/',
      'web-build/',
      'babel.config.js',
      'metro.config.js',
    ],
  },

  // Fichiers de config CommonJS (jest.config.js, commitlint.config.js)
  {
    files: ['*.config.js'],
    languageOptions: {
      globals: {
        module: 'readonly',
        require: 'readonly',
        __dirname: 'readonly',
      },
    },
  },

  // Regles de base JS
  js.configs.recommended,

  // Regles TypeScript
  ...tseslint.configs.recommended,

  // Configuration React + React Native
  {
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'react-native': reactNativePlugin,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // React
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // React Native
      'react-native/no-unused-styles': 'warn',
      'react-native/no-inline-styles': 'warn',

      // Interdiction console.log (utiliser logger.ts)
      'no-console': 'error',

      // TypeScript
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-require-imports': 'off',
    },
  },

  // Prettier en dernier (desactive les regles de formatage en conflit)
  prettierConfig,
);
