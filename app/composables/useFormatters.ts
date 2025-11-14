export const useFormatters = () => {
  const { locale } = useI18n();

  const formatCurrency = (value: number): string => {
    const currencyCode = locale.value === "sv" ? "SEK" : "USD";
    const localeCode = locale.value === "sv" ? "sv-SE" : "en-US";

    return new Intl.NumberFormat(localeCode, {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatCurrencyDecimal = (value: number): string => {
    const currencyCode = locale.value === "sv" ? "SEK" : "USD";
    const localeCode = locale.value === "sv" ? "sv-SE" : "en-US";

    return new Intl.NumberFormat(localeCode, {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercent = (value: number): string => {
    const localeCode = locale.value === "sv" ? "sv-SE" : "en-US";

    return new Intl.NumberFormat(localeCode, {
      style: "percent",
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value / 100);
  };

  const formatCurrencyCompact = (value: number): string => {
    const currencyCode = locale.value === "sv" ? "SEK" : "USD";
    const localeCode = locale.value === "sv" ? "sv-SE" : "en-US";
    const absValue = Math.abs(value);

    // For values over 1 million, use compact notation
    if (absValue >= 1000000) {
      const millions = value / 1000000;
      const suffix = locale.value === "sv" ? " mn" : "M";
      return `${millions.toFixed(1)}${suffix} ${
        currencyCode === "SEK" ? "kr" : "$"
      }`;
    }

    // For values over 1000, use 'k' notation
    if (absValue >= 1000) {
      const thousands = value / 1000;
      return `${thousands.toFixed(0)}k ${currencyCode === "SEK" ? "kr" : "$"}`;
    }

    // For smaller values, use regular formatting
    return formatCurrency(value);
  };

  return {
    formatCurrency,
    formatCurrencyDecimal,
    formatPercent,
    formatCurrencyCompact,
  };
};
