/**
 * Interest Rate Conversion Utilities
 *
 * Centralized utilities for converting between percentage and decimal representations
 * of interest rates. This ensures consistent handling of floating-point precision
 * and provides a single source of truth for conversion logic.
 */

/**
 * Converts a percentage interest rate to decimal format for storage
 * @param rate - Interest rate as percentage (e.g., 5.5 for 5.5%)
 * @returns Decimal representation as string (e.g., "0.055" for 5.5%)
 * @example
 * percentageToDecimal(5.5) // returns "0.055"
 * percentageToDecimal("5.5") // returns "0.055"
 */
export function percentageToDecimal(rate: string | number): string {
  return String(Number(rate) / 100);
}

/**
 * Converts a decimal interest rate to percentage format for display
 * @param rate - Interest rate as decimal (e.g., 0.055 for 5.5%)
 * @returns Percentage representation as string, rounded to 2 decimal places (e.g., "5.5" for 0.055)
 * @example
 * decimalToPercentage(0.055) // returns "5.5"
 * decimalToPercentage("0.055") // returns "5.5"
 * decimalToPercentage(null) // returns null
 */
export function decimalToPercentage(
  rate: string | number | null
): string | null {
  if (rate === null) return null;
  // Round to 2 decimal places to avoid floating-point precision errors
  return String(Math.round(Number(rate) * 100 * 100) / 100);
}

/**
 * Converts the interestRate field of an object from decimal to percentage for display
 * Useful for transforming database records before sending to the frontend
 * @param item - Object with an interestRate field
 * @returns New object with interestRate converted to percentage
 * @example
 * convertInterestRateForDisplay({ id: 1, interestRate: "0.055" })
 * // returns { id: 1, interestRate: "5.5" }
 */
export function convertInterestRateForDisplay<
  T extends { interestRate: string | null }
>(item: T): T {
  return {
    ...item,
    interestRate: decimalToPercentage(item.interestRate),
  };
}
