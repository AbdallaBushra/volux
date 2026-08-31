import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import commonEn from "../locales/en/common.json";
import commonAr from "../locales/ar/common.json";
import adminEn from "../locales/en/admin.json";
import adminAr from "../locales/ar/admin.json";

const LANGUAGE_KEY = "volux-language";
const LEGACY_LANGUAGE_KEY = "language";

const resolveLanguage = () => {
  const savedLanguage = localStorage.getItem(LANGUAGE_KEY);
  const legacyLanguage = localStorage.getItem(LEGACY_LANGUAGE_KEY);
  const language = savedLanguage || legacyLanguage || "ar";

  localStorage.setItem(LANGUAGE_KEY, language);
  localStorage.removeItem(LEGACY_LANGUAGE_KEY);
  return language;
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: commonEn,
        admin: adminEn,
      },
      ar: {
        common: commonAr,
        admin: adminAr,
      },
    },
    lng: resolveLanguage(),
    fallbackLng: "en",
    defaultNS: "common",
    ns: ["common", "admin"],
    interpolation: {
      escapeValue: false,
    },
  });

i18n.on("languageChanged", (lang) => {
  localStorage.setItem(LANGUAGE_KEY, lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
});

export default i18n;
