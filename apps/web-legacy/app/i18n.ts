import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import enTranslation from "../public/locales/en/common.json";
import esTranslation from "../public/locales/es/common.json";

i18next
  .use(initReactI18next) // Conecta i18next con react-i18next
  .init({
    resources: {
      en: { translation: enTranslation },
      es: { translation: esTranslation },
    },
    lng: "en", // Idioma por defecto
    fallbackLng: "en",
    interpolation: { escapeValue: false },
  });

export default i18next;
