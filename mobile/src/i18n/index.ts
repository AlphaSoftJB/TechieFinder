import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import yo from './locales/yo.json';
import ig from './locales/ig.json';
import ha from './locales/ha.json';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'yo', label: 'Yorùbá' },
  { code: 'ig', label: 'Igbo' },
  { code: 'ha', label: 'Hausa' },
] as const;

// Kept in-memory only (no AsyncStorage) for now: the app's language choice
// resets to English on restart. Wire up persistence once this doesn't risk
// colliding with the AsyncStorage mock individual test files set up.
i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    yo: { translation: yo },
    ig: { translation: ig },
    ha: { translation: ha },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
