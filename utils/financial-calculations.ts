/**
 * Shared financial calculation utilities
 * Used by both frontend and backend for consistent calculations
 */

/**
 * Monthly multipliers for converting different payment frequencies to monthly amounts
 * - monthly: 1x (baseline)
 * - yearly: divide by 12
 * - weekly: ~4.33 weeks per month (52 weeks / 12 months)
 * - bi-weekly: ~2.17 bi-weekly periods per month (26 periods / 12 months)
 * - daily: ~30 days per month
 */
export const MONTHLY_MULTIPLIERS = {
  monthly: 1,
  yearly: 1 / 12,
  weekly: 4.33,
  "bi-weekly": 2.17,
  daily: 30,
} as const;

export type Frequency = keyof typeof MONTHLY_MULTIPLIERS;

/**
 * Type guard to check if a string is a valid frequency
 */
export function isValidFrequency(value: string): value is Frequency {
  return value in MONTHLY_MULTIPLIERS;
}

/**
 * Convert an amount at a given frequency to its monthly equivalent
 *
 * @param amount - The amount to convert (string or number)
 * @param frequency - The frequency of the amount
 * @returns The monthly equivalent amount
 *
 * @example
 * toMonthlyAmount(1000, "yearly") // 83.33 (1000 / 12)
 * toMonthlyAmount(500, "weekly") // 2165 (500 * 4.33)
 * toMonthlyAmount("100", "monthly") // 100
 */
export function toMonthlyAmount(
  amount: string | number,
  frequency: string
): number {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) {
    return 0;
  }

  // Default to monthly if frequency is invalid
  if (!isValidFrequency(frequency)) {
    return numAmount;
  }

  return numAmount * MONTHLY_MULTIPLIERS[frequency];
}

/**
 * Convert a monthly amount to a different frequency
 *
 * @param monthlyAmount - The monthly amount to convert
 * @param targetFrequency - The target frequency
 * @returns The amount at the target frequency
 *
 * @example
 * fromMonthlyAmount(1200, "yearly") // 14400 (1200 * 12)
 * fromMonthlyAmount(1000, "weekly") // 231.01 (1000 / 4.33)
 */
export function fromMonthlyAmount(
  monthlyAmount: number,
  targetFrequency: string
): number {
  // Default to monthly if frequency is invalid
  if (!isValidFrequency(targetFrequency)) {
    return monthlyAmount;
  }

  return monthlyAmount / MONTHLY_MULTIPLIERS[targetFrequency];
}

/**
 * Convert an amount from one frequency to another
 *
 * @param amount - The amount to convert
 * @param fromFrequency - The source frequency
 * @param toFrequency - The target frequency
 * @returns The converted amount
 *
 * @example
 * convertFrequency(1000, "yearly", "monthly") // 83.33
 * convertFrequency(500, "weekly", "monthly") // 2165
 */
export function convertFrequency(
  amount: string | number,
  fromFrequency: string,
  toFrequency: string
): number {
  const monthly = toMonthlyAmount(amount, fromFrequency);
  return fromMonthlyAmount(monthly, toFrequency);
}
