import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "@/translations/en.json";
import fr from "@/translations/fr.json";
import { type Language as LanguageType } from "@/enum/language";

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: en,
      },
      fr: {
        translation: fr,
      },
    },
    lng: "en",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  });

export function applyLanguage(language: LanguageType) {
  i18n.changeLanguage(language);
}

export default i18n;
