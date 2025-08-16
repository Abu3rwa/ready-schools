import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpApi from 'i18next-http-backend';

// RTL languages
const rtlLanguages = ['ar', 'he', 'fa'];

// Apply RTL styles
const applyRTLStyles = (language) => {
  if (rtlLanguages.includes(language)) {
    document.dir = 'rtl';
    document.body.style.direction = 'rtl';
    document.body.style.textAlign = 'right';
  } else {
    document.dir = 'ltr';
    document.body.style.direction = 'ltr';
    document.body.style.textAlign = 'left';
  }
};

i18n
  .use(HttpApi) // Load translations from backend
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Pass the i18n instance to react-i18next.
  .init({
    supportedLngs: ['en', 'ar'],
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    // Options for language detector
    detection: {
      order: ['path', 'cookie', 'htmlTag', 'localStorage', 'subdomain'],
      caches: ['cookie', 'localStorage'],
    },
    // Backend options to load translations from public/locales
    backend: {
      loadPath: '/locales/{{lng}}/translation.json',
    },
    react: {
      useSuspense: false, // Set to false if you don't want to use Suspense
    },
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    // Add pluralization rules
    pluralSeparator: '_',
    contextSeparator: '_',
  });

// Apply RTL styles on language change
i18n.on('languageChanged', (lng) => {
  applyRTLStyles(lng);
});

// Apply RTL styles on initialization
applyRTLStyles(i18n.language);

export default i18n;
