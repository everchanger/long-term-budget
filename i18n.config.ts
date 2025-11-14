import en from "./locales/en.json";
import sv from "./locales/sv.json";

export default defineI18nConfig(() => ({
  legacy: false,
  locale: "en",
  fallbackLocale: "en",
  messages: {
    en,
    sv,
  },
  numberFormats: {
    en: {
      currency: {
        style: "currency",
        currency: "USD",
        notation: "standard",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      },
      currencyDecimal: {
        style: "currency",
        currency: "USD",
        notation: "standard",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
      decimal: {
        style: "decimal",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      },
      percent: {
        style: "percent",
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      },
    },
    sv: {
      currency: {
        style: "currency",
        currency: "SEK",
        notation: "standard",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      },
      currencyDecimal: {
        style: "currency",
        currency: "SEK",
        notation: "standard",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
      decimal: {
        style: "decimal",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      },
      percent: {
        style: "percent",
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      },
    },
  },
}));
