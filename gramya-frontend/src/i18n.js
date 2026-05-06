/**
 * i18n.js — react-i18next configuration
 * Supports: English (en), Kannada (kn), Hindi (hi)
 * Persists language selection in localStorage.
 */
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import kn from "./locales/kn.json";
import hi from "./locales/hi.json";

// Read persisted language or detect from browser
const savedLang = localStorage.getItem("gramya_language");
const browserLang = navigator.language?.slice(0, 2); // "en", "kn", "hi"
const supportedLangs = ["en", "kn", "hi"];
const defaultLang = supportedLangs.includes(savedLang)
  ? savedLang
  : supportedLangs.includes(browserLang)
  ? browserLang
  : "en";

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      kn: { translation: kn },
      hi: { translation: hi },
    },
    lng: defaultLang,
    fallbackLng: "en",
    interpolation: { escapeValue: false },
  });

export default i18n;
