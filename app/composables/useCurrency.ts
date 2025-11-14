/**
 * Currency formatting composable
 * Formats numbers based on user's selected currency preference
 */
export const useCurrency = () => {
  const { currency } = useUserPreferences();

  /**
   * Format a number as currency
   * @param value - The numeric value to format
   * @param options - Optional Intl.NumberFormat options
   */
  const formatCurrency = (
    value: number,
    options?: Intl.NumberFormatOptions
  ): string => {
    const currencyCode = currency.value;

    // Determine locale based on currency for proper number formatting
    const locale = currencyCode === "SEK" ? "sv-SE" : "en-US";

    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      ...options,
    }).format(value);
  };

  /**
   * Format currency with decimals
   */
  const formatCurrencyDecimal = (value: number): string => {
    return formatCurrency(value, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  /**
   * Format large currency values with abbreviations (k, M)
   */
  const formatCurrencyCompact = (value: number): string => {
    const absValue = Math.abs(value);
    const currencyCode = currency.value;
    const locale = currencyCode === "SEK" ? "sv-SE" : "en-US";

    // For Swedish, use "mn" instead of "M" for millions
    const millionSuffix = currencyCode === "SEK" ? " mn" : "M";
    const thousandSuffix = "k";

    if (absValue >= 1_000_000) {
      const formatted = new Intl.NumberFormat(locale, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }).format(value / 1_000_000);
      return `${formatted}${millionSuffix} ${currencyCode}`;
    } else if (absValue >= 1_000) {
      const formatted = new Intl.NumberFormat(locale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value / 1_000);
      return `${formatted}${thousandSuffix} ${currencyCode}`;
    }

    return formatCurrency(value);
  };

  /**
   * Get the currency symbol
   */
  const currencySymbol = computed(() => {
    return currency.value === "SEK" ? "kr" : "$";
  });

  /**
   * Get the currency code
   */
  const currencyCode = computed(() => currency.value);

  return {
    formatCurrency,
    formatCurrencyDecimal,
    formatCurrencyCompact,
    currencySymbol,
    currencyCode,
    currency,
  };
};
