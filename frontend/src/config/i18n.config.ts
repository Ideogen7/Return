import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import { registerTranslation, fr as frDates, en as enDates } from 'react-native-paper-dates';
import fr from '../i18n/locales/fr.json';
import en from '../i18n/locales/en.json';

registerTranslation('fr', frDates);
registerTranslation('en', enDates);

const deviceLanguage = getLocales()[0]?.languageCode ?? 'fr';

i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    en: { translation: en },
  },
  lng: deviceLanguage.startsWith('fr') ? 'fr' : 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
