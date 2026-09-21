import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./en.json";

/**
 * English only for now. Layouts must still use logical properties (start/end,
 * marginStart/marginEnd — never left/right) via `core/ui`, so adding Arabic later
 * is a resource-file swap, not a layout rewrite. Timezone is fixed to Africa/Cairo
 * since every GUC deadline is quoted in it regardless of device locale.
 */
export const TIMEZONE = "Africa/Cairo";

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en } },
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;
